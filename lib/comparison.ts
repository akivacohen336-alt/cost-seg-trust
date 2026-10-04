// Phase 7: the one-page comparison, its approval, the branded PDF and sending it.
import { config } from "./config";
import { db, logEvent } from "./db";
import { fallbackSummary, writeComparisonSummary, type ComparisonColumn } from "./ai";
import { loadDeal, setDealStage } from "./deals";
import { emailHtml, esc, sendEmail } from "./notify";
import { renderComparisonPdf } from "./pdf";
import { COMPARISON_ROWS, QUOTE_FIELDS, rowToValues, savingsPerDollar, type QuoteValues } from "./quote-fields";

export type ComparisonView = {
  comparison: any;
  deal: any;
  quotes: { inviteId: string; supplier: string; values: QuoteValues; aiFilled: string[]; mismatches: any[]; hidden: boolean; notes: any }[];
  columns: (ComparisonColumn & { inviteId: string; aiFilled: string[] })[];
  rows: typeof COMPARISON_ROWS;
  best: Record<string, number>;
};

export async function loadComparison(dealId: string): Promise<ComparisonView | null> {
  const sql = db();
  const [comparison] = await sql`select * from comparisons where deal_id = ${dealId}`;
  if (!comparison) return null;
  const deal = await loadDeal(dealId);
  const rows = await sql`
    select q.*, i.id as invite_id, s.company_name from supplier_quotes q
    join supplier_invites i on i.id = q.invite_id join suppliers s on s.id = i.supplier_id
    where i.deal_id = ${dealId} and i.status = 'submitted' order by q.submitted_at`;
  const overrides = comparison.overrides ?? {};
  const quotes = rows.map((r: any) => {
    const values = rowToValues(r);
    for (const [k, v] of Object.entries(overrides[r.invite_id] ?? {})) (values as any)[k] = v;
    return { inviteId: r.invite_id, supplier: r.company_name, values, aiFilled: r.ai_filled_fields ?? [], mismatches: r.ai_mismatches ?? [],
      hidden: (comparison.hidden_invites ?? []).includes(r.invite_id), notes: r.ai_notes ?? {} };
  });
  const visible = quotes.filter(q => !q.hidden);
  const columns = visible.map((q, i) => ({
    inviteId: q.inviteId, aiFilled: q.aiFilled,
    name: comparison.anonymize ? `Provider ${String.fromCharCode(65 + i)}` : q.supplier,
    values: { ...q.values, savingsPerDollar: savingsPerDollar(q.values) },
  }));
  const rowsShown = COMPARISON_ROWS.filter(r => !(comparison.hidden_rows ?? []).includes(r.key));
  const best: Record<string, number> = {};
  for (const r of rowsShown) {
    if (!r.best) continue;
    const nums = columns.map(c => Number((c.values as any)[r.key])).filter(n => isFinite(n) && n > 0);
    if (nums.length > 1) best[r.key] = r.best === "min" ? Math.min(...nums) : Math.max(...nums);
  }
  return { comparison, deal, quotes, columns, rows: rowsShown, best };
}

/** Creates the comparison (or refreshes its summary) from the submitted quotes. */
export async function buildComparison(dealId: string) {
  const sql = db();
  const [{ n }] = await sql`select count(*)::int n from supplier_invites where deal_id = ${dealId} and status = 'submitted'`;
  if (n === 0) return { ok: false, error: "No supplier quotes yet." };
  await sql`insert into comparisons (deal_id) values (${dealId}) on conflict (deal_id) do nothing`;
  await sql`update comparisons set status = 'draft' where deal_id = ${dealId} and status = 'awaiting_approval'`;
  const view = (await loadComparison(dealId))!;
  let summary: string, source: string;
  try {
    if (!config.anthropic.apiKey) throw new Error("AI not configured");
    summary = await writeComparisonSummary(view.deal, view.columns);
    source = "ai";
  } catch (e) {
    summary = fallbackSummary(view.deal.property_type, view.columns);
    source = `standard (${(e as Error).message.slice(0, 120)})`;
  }
  await sql`update comparisons set summary = ${summary}, summary_source = ${source} where deal_id = ${dealId}`;
  await logEvent(dealId, "comparison_built", { quotes: view.columns.length, summary: source === "ai" ? "AI" : "standard" });
  if (["new_request", "waiting_on_quotes", "quotes_received", "awaiting_approval"].includes(view.deal.stage)) {
    await setDealStage(dealId, "comparison_ready");
  }
  return { ok: true };
}

export async function saveComparisonEdits(dealId: string, edits: {
  summary?: string; anonymize?: boolean; hiddenRows?: string[]; hiddenInvites?: string[]; overrides?: Record<string, Record<string, unknown>>;
}) {
  const sql = db();
  const [c] = await sql`select * from comparisons where deal_id = ${dealId}`;
  if (!c || c.status !== "draft") return { ok: false, error: "Unlock the comparison to edit it." };
  const allowedKeys = new Set(QUOTE_FIELDS.map(f => f.key as string));
  const overrides = edits.overrides
    ? Object.fromEntries(Object.entries(edits.overrides).map(([inv, o]) => [inv, Object.fromEntries(Object.entries(o).filter(([k]) => allowedKeys.has(k)))]))
    : c.overrides;
  await sql`update comparisons set
      summary = ${edits.summary ?? c.summary},
      anonymize = ${edits.anonymize ?? c.anonymize},
      hidden_rows = ${edits.hiddenRows ?? c.hidden_rows},
      hidden_invites = ${edits.hiddenInvites ?? c.hidden_invites}::uuid[],
      overrides = ${sql.json(overrides)}
    where deal_id = ${dealId}`;
  return { ok: true };
}

/** Locks the comparison and generates the PDF for your approval. */
export async function prepareForApproval(dealId: string) {
  const view = await loadComparison(dealId);
  if (!view) return { ok: false, error: "Build the comparison first." };
  if (!view.columns.length) return { ok: false, error: "Show at least one supplier on the comparison." };
  const sql = db();
  const pdf = await renderComparisonPdf(view);
  const [{ v }] = await sql`select coalesce(max(version), 0) + 1 as v from pdf_reports where comparison_id = ${view.comparison.id}`;
  const street = String(view.deal.property_address).split(",")[0].replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `Cost-Seg-Trust-Comparison-CST-${view.deal.number}-${street}${v > 1 ? `-v${v}` : ""}.pdf`;
  const [report] = await sql`insert into pdf_reports (deal_id, comparison_id, version, filename, pdf)
    values (${dealId}, ${view.comparison.id}, ${v}, ${filename}, ${Buffer.from(pdf)}) returning id`;
  await sql`update comparisons set status = 'awaiting_approval' where id = ${view.comparison.id}`;
  await logEvent(dealId, "pdf_generated", { version: v });
  await setDealStage(dealId, "awaiting_approval");
  return { ok: true, reportId: report.id as string };
}

export async function unlockComparison(dealId: string) {
  await db()`update comparisons set status = 'draft' where deal_id = ${dealId} and status = 'awaiting_approval'`;
  const d = await loadDeal(dealId);
  if (d?.stage === "awaiting_approval") await setDealStage(dealId, "comparison_ready");
}

export const defaultClientMessage = (d: any, count: number) =>
  `Hi ${d.first_name},\n\nThank you for using Cost Seg Trust. We collected ${count} quote${count > 1 ? "s" : ""} for your property at ${d.property_address}, and your side-by-side comparison is attached.\n\nHappy to walk through it with you or your CPA. Just reply to this email or call ${config.contactPhone}.\n\nBest,\nCost Seg Trust`;

/** Your approval: emails the latest PDF to the client. */
export async function approveAndSend(dealId: string, message: string) {
  const sql = db();
  const view = await loadComparison(dealId);
  if (!view || view.comparison.status !== "awaiting_approval") return { ok: false, error: "Generate the PDF for approval first." };
  const [report] = await sql`select * from pdf_reports where comparison_id = ${view.comparison.id} order by version desc limit 1`;
  const d = view.deal;
  const text = message.trim() || defaultClientMessage(d, view.columns.length);
  const r = await sendEmail({
    to: d.email, dealId, purpose: "client_comparison", replyTo: config.contactEmail,
    subject: `Your cost segregation quote comparison: ${d.property_address}`,
    html: emailHtml("Your quote comparison", `<p style="margin:0;white-space:pre-line">${esc(text)}</p>`),
    text,
    attachments: [{ filename: report.filename, content: Buffer.from(report.pdf).toString("base64") }],
  });
  if (r.status !== "sent") return { ok: false, error: r.status === "skipped" ? "Email isn't set up yet, so nothing was sent." : `The email failed: ${r.error}` };
  await sql`update pdf_reports set sent_at = now(), sent_to = ${d.email} where id = ${report.id}`;
  await sql`update comparisons set status = 'sent', client_message = ${text}, approved_at = now(), sent_at = now() where id = ${view.comparison.id}`;
  await logEvent(dealId, "sent_to_client", { to: d.email, version: report.version });
  await setDealStage(dealId, "sent_to_client");
  return { ok: true };
}
