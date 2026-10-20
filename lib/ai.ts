// Phase 6: AI reads each supplier response (form + proposal PDF) and turns it
// into standardized data, then writes the client-facing comparison summary.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { verifyEvidence, type Evidence } from "./checks";
import { config } from "./config";
import { db, logEvent } from "./db";
import { COMPARISON_ROWS, QUOTE_FIELDS, STUDY_TYPES, benefitNotComparable, cellText, formatValue, rowToValues, type QuoteKey, type QuoteValues } from "./quote-fields";

let client: Anthropic | null = null;
function anthropic() {
  if (!config.anthropic.apiKey) throw new Error("AI is not configured (ANTHROPIC_API_KEY missing)");
  client ??= new Anthropic({ apiKey: config.anthropic.apiKey, baseURL: config.anthropic.baseUrl, timeout: 120_000, maxRetries: 2 });
  return client;
}

const num = z.number().nullable();
export const StandardQuoteSchema = z.object({
  fee: num.describe("Total study fee in US dollars"),
  studyType: z.enum(STUDY_TYPES).nullable(),
  siteVisit: z.boolean().nullable().describe("True if an in-person, on-site inspection is included; false if virtual or none"),
  turnaroundDays: num.describe("Delivery time in calendar days (convert weeks to days); the shortest if a range is given"),
  turnaroundDaysHigh: num.describe("Longest delivery time in calendar days, only if the provider gives a range"),
  reclassifiedPct: num.describe("Percent of depreciable basis reclassified to 5/7/15-year property, 0-100; the conservative figure if a range is given"),
  reclassifiedPctHigh: num.describe("High end of the percent reclassified, only if the provider gives a range"),
  depreciableBasis: num.describe("Depreciable basis (building cost, excluding land) the estimate is based on, in US dollars"),
  regularDepreciation: num.describe("First-year depreciation WITHOUT a study (straight-line only), in US dollars"),
  firstYearDeduction: num.describe("Total first-year depreciation WITH the study (accelerated method, bonus included), in US dollars; the conservative figure if a range is given"),
  firstYearDeductionHigh: num.describe("High end of first-year depreciation with the study, only if the provider gives a range"),
  increasedDeduction: num.describe("Extra first-year deduction from the study: with-study depreciation minus straight-line depreciation, in US dollars. Null if the provider's 'increased' figure simply equals its total first-year depreciation. The conservative figure if a range is given"),
  increasedDeductionHigh: num.describe("High end of the extra first-year deduction, only if the provider gives a range"),
  acceleratedAmount: num.describe("Total dollars of basis reclassified to 5, 7 and 15-year property"),
  firstYearTaxSavings: num.describe("Estimated first-year tax savings in US dollars; the conservative figure if a range is given"),
  firstYearTaxSavingsHigh: num.describe("High end of the first-year tax savings, only if the provider gives a range"),
  taxBenefitOn: z.enum(["extra", "total"]).nullable().describe("'extra' if the tax savings are figured on the extra deduction from the study (with-study depreciation minus straight-line); 'total' if figured on all first-year depreciation, regular portion included; null if unclear"),
  assumedTaxRate: num.describe("Tax rate the supplier assumed, as a percent 0-100"),
  scopeOfWork: z.string().nullable().describe("What the study includes, in under 25 words: method (engineering-based, purchase price allocation, desktop), inspection, report, CPA review, delivery time"),
  auditSupport: z.string().nullable().describe("Audit support terms in under 10 words"),
  includesLookback: z.boolean().nullable().describe("True if a look-back study / Form 3115 support is included"),
  lookbackNote: z.string().nullable().describe("Only if the provider says why Form 3115 / look-back is or isn't needed, in under 10 words, e.g. 'Not needed (placed in service in 2026)'"),
  paymentTerms: z.string().nullable().describe("Payment terms in under 10 words"),
  validDays: num.describe("How many days the quote stays valid"),
  inclusions: z.array(z.string()).describe("Notable inclusions, each under 12 words"),
  exclusions: z.array(z.string()).describe("Notable exclusions or extra charges, each under 12 words"),
  caveats: z.array(z.string()).describe("Assumptions or caveats that affect the estimates, each under 15 words"),
  evidence: z.array(z.object({
    field: z.string().describe("The field name, e.g. firstYearTaxSavings"),
    quote: z.string().describe("Text copied character for character from the proposal that states this number, one line or less"),
    page: z.number().nullable(),
  })).describe("One entry for every number you return, quoting the proposal where it is stated"),
});
export type StandardQuote = z.infer<typeof StandardQuoteSchema>;

const EXTRACT_INSTRUCTIONS = `You standardize cost segregation quotes for Cost Seg Trust, which compares quotes from several providers for a real estate investor.

You get the property facts, the values the supplier typed into our form, and usually the supplier's own proposal PDF. Return the standardized quote.

Rules:
- Use only what the supplier stated in the form or the proposal. If a value is not stated, return null. Never estimate or calculate a value the supplier did not give, except converting units (weeks to days, a decimal rate to a percent).
- Where the form and the PDF disagree, report what the PDF says; the app compares the two and flags differences for review.
- Money is a plain number of US dollars (no symbols). Percentages are 0-100.
- Keep the short text fields brief and neutral.
- When the provider gives a range (conservative and high end), put the conservative figures in the main fields and the high-end figures in the matching ...High fields.
- When the proposal covers several properties, use the portfolio totals the proposal states. Never add up figures yourself.
- For every number you return, add an evidence entry that copies, character for character, the short piece of the proposal that states it (for example "2026 Tax Savings (37%) $567,528"). The app checks each quote against the proposal and drops any number it cannot find there, so a number you cannot quote must be null.
- A column labelled "increased" counts as the extra deduction only if it is smaller than the provider's total year-1 depreciation; if the two are equal, leave increasedDeduction null and set taxBenefitOn from what the benefit is figured on.`;

function describeFormValues(v: QuoteValues, comments: string | null) {
  const lines = QUOTE_FIELDS.map(f => `${f.label}: ${v[f.key] == null ? "(blank)" : formatValue(v[f.key], f.kind === "study" || f.kind === "benefitOn" ? "text" : f.kind)}`);
  if (comments) lines.push(`Comments: ${comments}`);
  return lines.join("\n");
}

export async function extractStandardQuote(input: {
  facts: [string, string][]; form: QuoteValues; comments: string | null; pdf: Buffer | null;
}): Promise<StandardQuote> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.pdf) {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdf.toString("base64") }, title: "Supplier proposal" });
  }
  content.push({
    type: "text",
    text: `PROPERTY\n${input.facts.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nVALUES THE SUPPLIER TYPED INTO OUR FORM\n${describeFormValues(input.form, input.comments)}\n\n${input.pdf ? "The supplier's proposal PDF is attached above." : "No proposal PDF was attached."}`,
  });
  const res = await anthropic().beta.messages.parse({
    model: config.anthropic.model,
    max_tokens: 16000,
    system: EXTRACT_INSTRUCTIONS,
    messages: [{ role: "user", content }],
    output_config: { effort: "medium", format: betaZodOutputFormat(StandardQuoteSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (res.stop_reason === "refusal") throw new Error("The AI declined to read this proposal");
  if (!res.parsed_output) throw new Error(`The AI response could not be read (stop reason: ${res.stop_reason})`);
  return res.parsed_output;
}

const NUMERIC: QuoteKey[] = ["fee", "turnaroundDays", "turnaroundDaysHigh", "depreciableBasis", "regularDepreciation", "reclassifiedPct", "reclassifiedPctHigh", "firstYearDeduction", "firstYearDeductionHigh",
  "increasedDeduction", "increasedDeductionHigh", "acceleratedAmount", "firstYearTaxSavings", "firstYearTaxSavingsHigh", "assumedTaxRate", "validDays"];

/**
 * Combines what the supplier typed with what the AI read. The supplier's own
 * entries win; the AI fills blanks; differences are flagged for review.
 */
export function mergeQuote(form: QuoteValues, ai: StandardQuote) {
  const merged: QuoteValues = { ...form };
  const filled: QuoteKey[] = [];
  const mismatches: { field: QuoteKey; label: string; typed: unknown; pdf: unknown }[] = [];
  for (const f of QUOTE_FIELDS) {
    const typed = form[f.key];
    const read = (ai as any)[f.key];
    if (read == null || read === "") continue;
    if (typed == null || typed === "") { merged[f.key] = read; filled.push(f.key); continue; }
    const differs = NUMERIC.includes(f.key)
      ? Math.abs(Number(typed) - Number(read)) > Math.max(1, Math.abs(Number(read)) * 0.01)
      : typeof typed === "boolean" ? typed !== read : false;
    if (differs) mismatches.push({ field: f.key, label: f.label, typed, pdf: read });
  }
  return { merged, filled, mismatches };
}

/** The proposal's text, page by page, or null if it can't be read (a scanned image, say). */
export async function proposalText(pdf: Buffer | Uint8Array): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(new Uint8Array(pdf));
    const { text } = await extractText(doc, { mergePages: true });
    return String(text).trim() || null;
  } catch {
    return null;
  }
}

/** Runs AI standardization for one stored supplier quote. Never throws. */
export async function standardizeQuote(quoteId: string) {
  const sql = db();
  const [q] = await sql`
    select q.*, i.deal_id, s.company_name from supplier_quotes q
    join supplier_invites i on i.id = q.invite_id join suppliers s on s.id = i.supplier_id where q.id = ${quoteId}`;
  if (!q) return { status: "failed" as const, error: "Quote not found" };
  if (!config.anthropic.apiKey) {
    await sql`update supplier_quotes set ai_status = 'skipped', ai_error = 'AI not configured' where id = ${quoteId}`;
    return { status: "skipped" as const };
  }
  const [d] = await sql`select * from deals where id = ${q.deal_id}`;
  const { supplierFacts } = await import("./suppliers");
  // Start from what the supplier typed (ignore earlier AI fills on a re-run).
  const form = rowToValues(q);
  for (const k of q.ai_filled_fields as QuoteKey[]) form[k] = null;
  try {
    const read = await extractStandardQuote({ facts: supplierFacts(d), form, comments: q.comments, pdf: q.proposal_pdf ?? null });
    // Keep only numbers the proposal itself states; the rest show as "Not stated".
    const text = q.proposal_pdf ? await proposalText(q.proposal_pdf) : null;
    const { kept, rejected } = verifyEvidence(read as QuoteValues, read.evidence as Evidence[], text);
    const ai = { ...read, ...kept } as StandardQuote;
    const { merged, filled, mismatches } = mergeQuote(form, ai);
    const cols: Record<string, unknown> = {};
    for (const f of QUOTE_FIELDS) cols[f.column] = merged[f.key] ?? null;
    await sql`update supplier_quotes set ${sql(cols as any)}, ai_extracted = ${sql.json(ai as any)}, ai_filled_fields = ${filled},
              ai_mismatches = ${sql.json(mismatches as any)}, ai_notes = ${sql.json({ inclusions: ai.inclusions, exclusions: ai.exclusions, caveats: ai.caveats, rejected } as any)},
              ai_status = 'done', ai_error = null where id = ${quoteId}`;
    await logEvent(q.deal_id, "ai_standardized", { supplier: q.company_name, filled: filled.length, mismatches: mismatches.length, rejected: rejected.length });
    return { status: "done" as const, filled, mismatches, rejected };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await sql`update supplier_quotes set ai_status = 'failed', ai_error = ${msg} where id = ${quoteId}`;
    await logEvent(q.deal_id, "ai_failed", { supplier: q.company_name, error: msg });
    return { status: "failed" as const, error: msg };
  }
}

// ---------- Comparison summary ----------

export type ComparisonColumn = { name: string; values: QuoteValues & { savingsPerDollar?: number | null; savingsPerDollarHigh?: number | null } };

export async function writeComparisonSummary(deal: { property_type: string; purchase_price: unknown; placed_in_service: unknown }, cols: ComparisonColumn[]) {
  const table = cols.map(c => ({
    provider: c.name,
    ...Object.fromEntries(COMPARISON_ROWS.map(r => [r.label, cellText(c.values as any, r)])),
  }));
  const res = await anthropic().beta.messages.create({
    model: config.anthropic.model,
    max_tokens: 4000,
    system: "You write short, plain-English summaries for Cost Seg Trust's one-page cost segregation quote comparisons. The reader is a real estate investor, and often their CPA. Be factual and neutral. You are not giving tax advice.",
    messages: [{
      role: "user",
      content: `Property: ${deal.property_type}, purchase price ${deal.purchase_price == null ? "not given" : "$" + Math.round(Number(deal.purchase_price)).toLocaleString("en-US")}.

Write the summary in 4 to 5 sentences. Start with one sentence that names the provider we recommend and why, for example "Our pick: X, because ...". Then cover the fee range, the range of estimated first-year tax benefit, and any difference that matters (a desktop study versus a full engineering study with a site visit, weaker audit support, or providers using a different depreciable basis or tax rate, which makes their benefit figures not directly comparable). A tax benefit marked as tax on all year-1 depreciation includes depreciation the client would get with no study, so never call it larger than another provider's benefit and never base the recommendation on it. Use only the figures below and never invent a number. A value of "—" means the provider did not state it. Plain sentences only, no headings or bullet points.

${JSON.stringify(table, null, 1)}`,
    }],
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (res.stop_reason === "refusal") throw new Error("The AI declined to write the summary");
  const text = res.content.filter(b => b.type === "text").map(b => (b as Anthropic.Beta.BetaTextBlock).text).join("").trim();
  if (!text) throw new Error("The AI returned an empty summary");
  return text;
}

/**
 * Plain summary from the numbers, used when AI is not configured, fails, or
 * mentions a number that isn't in the table. It only states rankings the
 * table itself shows in green, and only compares benefits that are comparable.
 */
export function fallbackSummary(propertyType: string, cols: ComparisonColumn[], best: Record<string, number> = {}) {
  if (!cols.length) return "";
  const pick = (k: string) => cols.filter(c => Number((c.values as any)[k]) > 0);
  const fees = pick("fee").map(c => Number(c.values.fee));
  const parts = [`We received ${cols.length} quote${cols.length > 1 ? "s" : ""} for your ${propertyType.toLowerCase()} property.`];
  if (fees.length > 1) parts.push(`Fees range from ${formatValue(Math.min(...fees), "money")} to ${formatValue(Math.max(...fees), "money")}.`);
  else if (fees.length) parts.push(`The fee is ${formatValue(fees[0], "money")}.`);
  const comparable = cols.filter(c => Number(c.values.firstYearTaxSavings) > 0 && !benefitNotComparable(c.values));
  for (const c of comparable) parts.push(`${c.name} estimates a first-year tax benefit of ${cellText(c.values as any, { key: "firstYearTaxSavings", kind: "money" })} on the extra deduction from the study.`);
  const other = cols.filter(c => Number(c.values.firstYearTaxSavings) > 0 && benefitNotComparable(c.values));
  if (other.length) parts.push(`${other.map(c => c.name).join(" and ")} ${other.length > 1 ? "give benefits" : "gives a benefit"} that cannot be compared with the others (see the table).`);
  const winner = (k: string) => cols.find(c => best[k] !== undefined && Number((c.values as any)[k]) === best[k]);
  const perDollar = winner("savingsPerDollar");
  if (perDollar) parts.push(`${perDollar.name} has the highest tax benefit per $1 of fee.`);
  const fast = winner("turnaroundDays");
  if (fast) parts.push(`${fast.name} is the fastest, at ${cellText(fast.values as any, { key: "turnaroundDays", kind: "days" })}.`);
  return parts.join(" ");
}
