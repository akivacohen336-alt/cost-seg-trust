// Phase 6: AI reads each supplier response (form + proposal PDF) and turns it
// into standardized data, then writes the client-facing comparison summary.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { config } from "./config";
import { db, logEvent } from "./db";
import { COMPARISON_ROWS, QUOTE_FIELDS, STUDY_TYPES, formatValue, rowToValues, type QuoteKey, type QuoteValues } from "./quote-fields";

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
  siteVisit: z.boolean().nullable().describe("True if an on-site inspection is included"),
  turnaroundDays: num.describe("Delivery time in calendar days (convert weeks to days)"),
  reclassifiedPct: num.describe("Percent of depreciable basis reclassified to 5/7/15-year property, 0-100"),
  firstYearDeduction: num.describe("Estimated first-year depreciation deduction in US dollars"),
  firstYearTaxSavings: num.describe("Estimated first-year tax savings in US dollars"),
  assumedTaxRate: num.describe("Tax rate the supplier assumed, as a percent 0-100"),
  auditSupport: z.string().nullable().describe("Audit support terms in under 10 words"),
  includesLookback: z.boolean().nullable().describe("True if a look-back study / Form 3115 support is included"),
  paymentTerms: z.string().nullable().describe("Payment terms in under 10 words"),
  validDays: num.describe("How many days the quote stays valid"),
  inclusions: z.array(z.string()).describe("Notable inclusions, each under 12 words"),
  exclusions: z.array(z.string()).describe("Notable exclusions or extra charges, each under 12 words"),
  caveats: z.array(z.string()).describe("Assumptions or caveats that affect the estimates, each under 15 words"),
});
export type StandardQuote = z.infer<typeof StandardQuoteSchema>;

const EXTRACT_INSTRUCTIONS = `You standardize cost segregation quotes for Cost Seg Trust, which compares quotes from several providers for a real estate investor.

You get the property facts, the values the supplier typed into our form, and usually the supplier's own proposal PDF. Return the standardized quote.

Rules:
- Use only what the supplier stated in the form or the proposal. If a value is not stated, return null. Never estimate or calculate a value the supplier did not give, except converting units (weeks to days, a decimal rate to a percent).
- Where the form and the PDF disagree, report what the PDF says; the app compares the two and flags differences for review.
- Money is a plain number of US dollars (no symbols). Percentages are 0-100.
- Keep the short text fields brief and neutral.`;

function describeFormValues(v: QuoteValues, comments: string | null) {
  const lines = QUOTE_FIELDS.map(f => `${f.label}: ${v[f.key] == null ? "(blank)" : formatValue(v[f.key], f.kind === "study" ? "text" : f.kind)}`);
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

const NUMERIC: QuoteKey[] = ["fee", "turnaroundDays", "reclassifiedPct", "firstYearDeduction", "firstYearTaxSavings", "assumedTaxRate", "validDays"];

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
    const ai = await extractStandardQuote({ facts: supplierFacts(d), form, comments: q.comments, pdf: q.proposal_pdf ?? null });
    const { merged, filled, mismatches } = mergeQuote(form, ai);
    const cols: Record<string, unknown> = {};
    for (const f of QUOTE_FIELDS) cols[f.column] = merged[f.key] ?? null;
    await sql`update supplier_quotes set ${sql(cols as any)}, ai_extracted = ${sql.json(ai as any)}, ai_filled_fields = ${filled},
              ai_mismatches = ${sql.json(mismatches as any)}, ai_notes = ${sql.json({ inclusions: ai.inclusions, exclusions: ai.exclusions, caveats: ai.caveats })},
              ai_status = 'done', ai_error = null where id = ${quoteId}`;
    await logEvent(q.deal_id, "ai_standardized", { supplier: q.company_name, filled: filled.length, mismatches: mismatches.length });
    return { status: "done" as const, filled, mismatches };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await sql`update supplier_quotes set ai_status = 'failed', ai_error = ${msg} where id = ${quoteId}`;
    await logEvent(q.deal_id, "ai_failed", { supplier: q.company_name, error: msg });
    return { status: "failed" as const, error: msg };
  }
}

// ---------- Comparison summary ----------

export type ComparisonColumn = { name: string; values: QuoteValues & { savingsPerDollar?: number | null } };

export async function writeComparisonSummary(deal: { property_type: string; purchase_price: unknown; placed_in_service: unknown }, cols: ComparisonColumn[]) {
  const table = cols.map(c => ({
    provider: c.name,
    ...Object.fromEntries(COMPARISON_ROWS.map(r => [r.label, formatValue((c.values as any)[r.key], r.kind)])),
  }));
  const res = await anthropic().beta.messages.create({
    model: config.anthropic.model,
    max_tokens: 4000,
    system: "You write short, plain-English summaries for Cost Seg Trust's one-page cost segregation quote comparisons. The reader is a real estate investor, and often their CPA. Be factual and neutral. You are not giving tax advice.",
    messages: [{
      role: "user",
      content: `Property: ${deal.property_type}, purchase price $${Math.round(Number(deal.purchase_price)).toLocaleString("en-US")}.

Write a 3 to 4 sentence summary of these quotes: the fee range, the range of estimated first-year tax savings, which provider offers the most estimated savings per dollar of fee, which is fastest, and any difference that matters (for example a desktop study versus a full engineering study with a site visit, or weaker audit support). Use only the figures below, and never invent a number. Plain sentences only, no headings or bullet points.

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

/** Plain summary from the numbers, used when AI is not configured or fails. */
export function fallbackSummary(propertyType: string, cols: ComparisonColumn[]) {
  if (!cols.length) return "";
  const pick = (k: string) => cols.filter(c => Number((c.values as any)[k]) > 0);
  const fees = pick("fee").map(c => Number(c.values.fee));
  const sav = pick("firstYearTaxSavings").map(c => Number(c.values.firstYearTaxSavings));
  const parts = [`We received ${cols.length} quote${cols.length > 1 ? "s" : ""} for your ${propertyType.toLowerCase()} property.`];
  if (fees.length) parts.push(`Fees range from ${formatValue(Math.min(...fees), "money")} to ${formatValue(Math.max(...fees), "money")}.`);
  if (sav.length) parts.push(`Estimated first-year tax savings range from ${formatValue(Math.min(...sav), "money")} to ${formatValue(Math.max(...sav), "money")}.`);
  const best = pick("savingsPerDollar").sort((a, b) => Number(b.values.savingsPerDollar) - Number(a.values.savingsPerDollar))[0];
  if (best && cols.length > 1) parts.push(`${best.name} offers the most estimated savings per dollar of fee.`);
  const fast = pick("turnaroundDays").sort((a, b) => Number(a.values.turnaroundDays) - Number(b.values.turnaroundDays))[0];
  if (fast && cols.length > 1) parts.push(`${fast.name} is fastest at ${fast.values.turnaroundDays} days.`);
  return parts.join(" ");
}
