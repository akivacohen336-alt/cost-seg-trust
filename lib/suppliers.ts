// Phase 5: sending deals to suppliers, personalized secure links, the
// 40-hour response window, reminders, and supplier responses.
import { createHash, randomBytes } from "node:crypto";
import { config } from "./config";
import { db, logEvent } from "./db";
import { loadDeal, setDealStage } from "./deals";
import { alertOwner, emailHtml, esc, sendEmail, usd } from "./notify";
import { QUOTE_FIELDS, type QuoteValues } from "./quote-fields";

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
export const supplierLink = (token: string) => `${config.appUrl}/q/${token}`;
const dealLink = (id: string) => `${config.appUrl}/admin/deals/${id}`;
const fmtDate = (v: Date | string) => (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10);
const dueText = (d: Date) =>
  d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" });

/** Property facts a supplier may see. Never the client's name, email, phone or street address. */
export function supplierFacts(d: any) {
  return [
    ["Property type", d.property_type],
    ["Location", d.property_city_state || "Provided after engagement"],
    ["Purchase price", usd(d.purchase_price)],
    ["Placed in service", fmtDate(d.placed_in_service)],
    ["Land value", d.land_value || "Not provided"],
    ["Renovation spend", d.renovation_spend == null ? "Not provided" : usd(d.renovation_spend)],
    ["Owner has a CPA", d.has_cpa == null ? "Not provided" : d.has_cpa ? "Yes" : "No"],
  ] as [string, string][];
}

async function emailInvite(d: any, supplier: any, token: string, due: Date, kind: "invite" | "reminder") {
  const facts = supplierFacts(d);
  const subject = kind === "invite"
    ? `Quote request CST-${d.number}: ${d.property_type} in ${d.property_city_state ?? "the US"}`
    : `Reminder: quote request CST-${d.number} is due ${dueText(due)}`;
  const intro = kind === "invite"
    ? `<p style="margin:0 0 12px">Hi ${esc(supplier.contact_name || supplier.company_name)},</p><p style="margin:0 0 12px">Cost Seg Trust has a new cost segregation opportunity and would like your quote. Please respond by <b>${esc(dueText(due))}</b> (${config.quoteWindowHours} hours).</p>`
    : `<p style="margin:0 0 12px">Hi ${esc(supplier.contact_name || supplier.company_name)},</p><p style="margin:0 0 12px">A friendly reminder that your quote for this property is due by <b>${esc(dueText(due))}</b>.</p>`;
  const table = `<table style="border-collapse:collapse;width:100%">${facts.map(([k, v]) =>
    `<tr><td style="padding:5px 0;color:#5B6878;width:150px">${esc(k)}</td><td style="padding:5px 0">${esc(v)}</td></tr>`).join("")}</table>
    <p style="margin:14px 0 0;color:#5B6878;font-size:13px">This link is personal to ${esc(supplier.company_name)}. You can attach your proposal PDF on the form.</p>`;
  return sendEmail({
    to: supplier.email, subject, purpose: kind === "invite" ? "supplier_invite" : "supplier_reminder", dealId: d.id,
    html: emailHtml(kind === "invite" ? "Quote request" : "Quote reminder", intro + table, { href: supplierLink(token), label: "Submit your quote" }),
    text: `${subject}\n\n${facts.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nSubmit your quote: ${supplierLink(token)}\nDue: ${dueText(due)}`,
  });
}

export type SendResult = { invited: number; skipped: number; error?: string };

/** Invites suppliers to quote on a deal. Never invites the same supplier twice. */
export async function sendDealToSuppliers(dealId: string, supplierIds: string[]): Promise<SendResult> {
  const d = await loadDeal(dealId);
  if (!d) return { invited: 0, skipped: 0, error: "Deal not found" };
  const sql = db();
  const [{ n: existing }] = await sql`select count(*)::int n from supplier_invites where deal_id = ${dealId}`;
  const unique = [...new Set(supplierIds)];
  const room = config.maxSuppliersPerDeal - existing;
  if (unique.length === 0) return { invited: 0, skipped: 0, error: "Pick at least one supplier." };
  if (unique.length > room) return { invited: 0, skipped: 0, error: `Up to ${config.maxSuppliersPerDeal} suppliers per deal. You can add ${Math.max(room, 0)} more.` };

  const suppliers = await sql`select * from suppliers where id = any(${unique}::uuid[]) and active`;
  // Real suppliers only ever hear about real website requests.
  if (d.is_test && suppliers.some((s: any) => !s.is_test)) {
    return { invited: 0, skipped: 0, error: "This is a test deal, so it can only go to test suppliers." };
  }
  let invited = 0;
  for (const s of suppliers) {
    const token = newToken();
    const [inv] = await sql`
      insert into supplier_invites (deal_id, supplier_id, token_hash, due_at, link_sent_count)
      values (${dealId}, ${s.id}, ${hashToken(token)}, now() + make_interval(hours => ${config.quoteWindowHours}), 1)
      on conflict (deal_id, supplier_id) do nothing
      returning id, due_at`;
    if (!inv) continue;
    invited++;
    const r = await emailInvite(d, s, token, inv.due_at, "invite");
    await logEvent(dealId, "supplier_invited", { supplier: s.company_name, email: r.status });
  }
  if (invited > 0 && d.stage === "new_request") await setDealStage(dealId, "waiting_on_quotes");
  return { invited, skipped: unique.length - invited };
}

/** Issues a fresh link (the old one stops working) and emails it again. */
export async function resendInvite(inviteId: string) {
  const sql = db();
  const [inv] = await sql`select i.*, s.company_name, s.contact_name, s.email::text as email
                          from supplier_invites i join suppliers s on s.id = i.supplier_id where i.id = ${inviteId}`;
  if (!inv || inv.status === "submitted" || inv.status === "declined") return { ok: false };
  if (!(await canReach(inv.deal_id, inv.supplier_id))) return { ok: false };
  const token = newToken();
  await sql`update supplier_invites set previous_token_hash = token_hash, token_hash = ${hashToken(token)}, link_sent_count = link_sent_count + 1 where id = ${inviteId}`;
  const d = await loadDeal(inv.deal_id);
  await emailInvite(d, inv, token, inv.due_at, "invite");
  await logEvent(inv.deal_id, "supplier_link_resent", { supplier: inv.company_name });
  return { ok: true, link: supplierLink(token) };
}

/** Finds the invite behind a supplier link. */
export async function findInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{30,80}$/.test(token)) return null;
  const [inv] = await db()`
    select i.*, s.company_name, s.contact_name, s.email::text as supplier_email
    from supplier_invites i join suppliers s on s.id = i.supplier_id
    where i.token_hash = ${hashToken(token)} or i.previous_token_hash = ${hashToken(token)}
    limit 1`;
  if (!inv) return null;
  const d = await loadDeal(inv.deal_id);
  return { invite: inv, deal: d };
}

export async function markViewed(inviteId: string) {
  await db()`update supplier_invites set status = 'viewed', viewed_at = now() where id = ${inviteId} and status = 'invited'`;
}

const PENDING = ["invited", "viewed", "expired"];

/** Saves a supplier's quote. Returns the new quote id, or null if this link already responded. */
export async function submitSupplierQuote(token: string, values: QuoteValues, comments: string | null,
  pdf: { filename: string; bytes: Buffer } | null): Promise<{ quoteId: string; dealId: string } | null> {
  const found = await findInvite(token);
  if (!found || !PENDING.includes(found.invite.status)) return null;
  const { invite, deal } = found;
  const sql = db();
  const cols: Record<string, unknown> = {};
  for (const f of QUOTE_FIELDS) cols[f.column] = values[f.key] ?? null;
  const quoteId = await sql.begin(async tx => {
    const [upd] = await tx`update supplier_invites set status = 'submitted', responded_at = now()
                           where id = ${invite.id} and status = any(${PENDING}) returning id`;
    if (!upd) return null;
    const [q] = await tx`insert into supplier_quotes ${tx({
      invite_id: invite.id, ...cols, comments, proposal_pdf: pdf?.bytes ?? null, proposal_filename: pdf?.filename ?? null,
      ai_status: pdf ? "pending" : "skipped",
    } as any)} returning id`;
    return q.id as string;
  });
  if (!quoteId) return null;
  const late = new Date() > new Date(invite.due_at);
  await logEvent(deal.id, "supplier_submitted", { supplier: invite.company_name, fee: values.fee ?? null, late });
  await afterSupplierResponse(deal.id, `${invite.company_name} sent a quote${values.fee ? ` (${usd(values.fee as number)})` : ""}${late ? ", after the deadline" : ""}`);
  return { quoteId, dealId: deal.id };
}

export async function declineSupplierQuote(token: string, reason: string | null) {
  const found = await findInvite(token);
  if (!found || !PENDING.includes(found.invite.status)) return false;
  const { invite, deal } = found;
  await db()`update supplier_invites set status = 'declined', responded_at = now(), decline_reason = ${reason}
             where id = ${invite.id}`;
  await logEvent(deal.id, "supplier_declined", { supplier: invite.company_name, reason });
  await afterSupplierResponse(deal.id, `${invite.company_name} declined${reason ? `: ${reason}` : ""}`);
  return true;
}

export async function inviteCounts(dealId: string) {
  const [c] = await db()`
    select count(*)::int as total,
           count(*) filter (where status = 'submitted')::int as submitted,
           count(*) filter (where status = 'declined')::int as declined,
           count(*) filter (where status in ('invited','viewed'))::int as open,
           count(*) filter (where status = 'expired')::int as expired
    from supplier_invites where deal_id = ${dealId}`;
  return c as { total: number; submitted: number; declined: number; open: number; expired: number };
}

async function afterSupplierResponse(dealId: string, what: string) {
  const d = await loadDeal(dealId);
  const c = await inviteCounts(dealId);
  const responded = c.submitted + c.declined;
  await alertOwner(dealId, `CST-${d.number}: ${what} (${responded} of ${c.total} responded)`,
    `${d.property_type} at ${d.property_address}\n${c.submitted} quotes in, ${c.declined} declined, ${c.open} still open.`, dealLink(dealId));
  if (c.open === 0 && c.submitted > 0 && d.stage === "waiting_on_quotes") {
    await db()`update deals set quotes_window_closed_at = coalesce(quotes_window_closed_at, now()) where id = ${dealId}`;
    await setDealStage(dealId, "quotes_received");
  }
}

/**
 * Runs the 40-hour clock. Safe to call as often as you like (an hourly
 * scheduler calls it): sends each reminder once, closes each window once.
 */
/** False when a test deal would reach a real supplier. */
async function canReach(dealId: string, supplierId: string) {
  const [r] = await db()`select not (d.is_test and not s.is_test) as ok from deals d, suppliers s
                         where d.id = ${dealId} and s.id = ${supplierId}`;
  return !!r?.ok;
}

export async function runDeadlines(now = new Date()) {
  const sql = db();
  const result = { reminders: 0, expired: 0, closedDeals: 0 };

  const due = await sql`
    update supplier_invites i set reminder_sent_at = ${now}
    where status in ('invited','viewed') and reminder_sent_at is null and due_at > ${now}
      and invited_at <= ${now}::timestamptz - make_interval(hours => ${config.reminderAfterHours})
    returning i.*`;
  for (const inv of due) {
    if (!(await canReach(inv.deal_id, inv.supplier_id))) continue;
    const [s] = await sql`select * from suppliers where id = ${inv.supplier_id}`;
    const token = newToken();
    await sql`update supplier_invites set previous_token_hash = token_hash, token_hash = ${hashToken(token)}, link_sent_count = link_sent_count + 1 where id = ${inv.id}`;
    await emailInvite(await loadDeal(inv.deal_id), s, token, inv.due_at, "reminder");
    await logEvent(inv.deal_id, "supplier_reminded", { supplier: s.company_name });
    result.reminders++;
  }

  const expired = await sql`
    update supplier_invites set status = 'expired'
    where status in ('invited','viewed') and due_at <= ${now}
    returning deal_id`;
  result.expired = expired.length;

  // Close the window for deals with nothing left open.
  const closing = await sql`
    update deals d set quotes_window_closed_at = ${now}
    where d.quotes_window_closed_at is null and d.stage = 'waiting_on_quotes'
      and exists (select 1 from supplier_invites i where i.deal_id = d.id)
      and not exists (select 1 from supplier_invites i where i.deal_id = d.id and i.status in ('invited','viewed'))
    returning d.id, d.number`;
  for (const d of closing) {
    const c = await inviteCounts(d.id);
    await logEvent(d.id, "quote_window_closed", { submitted: c.submitted, declined: c.declined, expired: c.expired });
    if (c.submitted > 0) await setDealStage(d.id, "quotes_received");
    await alertOwner(d.id, `CST-${d.number}: ${config.quoteWindowHours}-hour window closed, ${c.submitted} of ${c.total} quotes in`,
      c.submitted > 0 ? "You can build the comparison now." : "No quotes came in. Consider inviting more suppliers.", dealLink(d.id));
    result.closedDeals++;
  }
  return result;
}
