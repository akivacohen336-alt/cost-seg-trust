"use server";

// Admin actions for phases 5-7: suppliers, AI and the comparison one-pager.
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { standardizeQuote } from "@/lib/ai";
import { approveAndSend, buildComparison, prepareForApproval, saveComparisonEdits, unlockComparison } from "@/lib/comparison";
import { resendInvite, runDeadlines, sendDealToSuppliers } from "@/lib/suppliers";

type Result = { ok: boolean; message: string; link?: string };
const isId = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const refresh = (dealId: string) => {
  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath(`/admin/deals/${dealId}/comparison`);
  revalidatePath("/admin");
};

export async function sendToSuppliers(_: unknown, form: FormData): Promise<Result> {
  await requireAdmin();
  const dealId = String(form.get("dealId"));
  const ids = form.getAll("supplierId").map(String).filter(isId);
  const r = await sendDealToSuppliers(dealId, ids);
  refresh(dealId);
  if (r.error) return { ok: false, message: r.error };
  return { ok: true, message: `Sent to ${r.invited} supplier${r.invited === 1 ? "" : "s"}${r.skipped ? ` (${r.skipped} already had it)` : ""}. The 40-hour clock has started.` };
}

export async function resendSupplierLink(inviteId: string, dealId: string): Promise<Result> {
  await requireAdmin();
  if (!isId(inviteId)) return { ok: false, message: "Unknown invite." };
  const r = await resendInvite(inviteId);
  refresh(dealId);
  return r.ok ? { ok: true, message: "New link emailed. The old link still works too.", link: r.link } : { ok: false, message: "This supplier has already responded." };
}

export async function rerunAi(quoteId: string, dealId: string): Promise<Result> {
  await requireAdmin();
  if (!isId(quoteId)) return { ok: false, message: "Unknown quote." };
  const r = await standardizeQuote(quoteId);
  refresh(dealId);
  if (r.status === "done") return { ok: true, message: `AI read the proposal: filled ${r.filled.length} field(s), ${r.mismatches.length} mismatch(es).` };
  if (r.status === "skipped") return { ok: false, message: "AI isn't set up yet (add ANTHROPIC_API_KEY)." };
  return { ok: false, message: `AI couldn't read it: ${r.error}` };
}

export async function checkDeadlinesNow(): Promise<Result> {
  await requireAdmin();
  const r = await runDeadlines();
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Reminders sent: ${r.reminders}. Invites expired: ${r.expired}. Deals closed: ${r.closedDeals}.` };
}

export async function buildComparisonAction(dealId: string): Promise<Result> {
  await requireAdmin();
  const r = await buildComparison(dealId);
  refresh(dealId);
  return r.ok ? { ok: true, message: "Comparison built." } : { ok: false, message: r.error ?? "Couldn't build it." };
}

export async function saveComparisonAction(dealId: string, edits: {
  summary: string; anonymize: boolean; hiddenRows: string[]; hiddenInvites: string[]; overrides: Record<string, Record<string, unknown>>;
}): Promise<Result> {
  await requireAdmin();
  const r = await saveComparisonEdits(dealId, {
    summary: String(edits.summary ?? "").slice(0, 4000),
    anonymize: !!edits.anonymize,
    hiddenRows: (edits.hiddenRows ?? []).map(String),
    hiddenInvites: (edits.hiddenInvites ?? []).filter(isId),
    overrides: Object.fromEntries(Object.entries(edits.overrides ?? {}).filter(([k]) => isId(k))),
  });
  refresh(dealId);
  return r.ok ? { ok: true, message: "Saved." } : { ok: false, message: r.error ?? "Couldn't save." };
}

export async function generatePdfAction(dealId: string): Promise<Result> {
  await requireAdmin();
  const r = await prepareForApproval(dealId);
  refresh(dealId);
  return r.ok ? { ok: true, message: "PDF ready for your approval." } : { ok: false, message: r.error ?? "Couldn't make the PDF." };
}

export async function unlockAction(dealId: string): Promise<Result> {
  await requireAdmin();
  await unlockComparison(dealId);
  refresh(dealId);
  return { ok: true, message: "Unlocked for editing." };
}

export async function approveAndSendAction(dealId: string, message: string): Promise<Result> {
  await requireAdmin();
  const r = await approveAndSend(dealId, String(message ?? "").slice(0, 5000));
  refresh(dealId);
  return r.ok ? { ok: true, message: "Approved and emailed to the client." } : { ok: false, message: r.error ?? "Couldn't send." };
}

export async function latestReportId(dealId: string) {
  await requireAdmin();
  const [r] = await db()`select id from pdf_reports where deal_id = ${dealId} order by created_at desc limit 1`;
  return (r?.id as string) ?? null;
}
