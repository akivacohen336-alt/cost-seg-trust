// Clients and quotes typed in on the dashboard by the team, for clients who
// came in by phone or email and vendors who sent their proposal by email.
// Nothing here emails anyone: not the client, not the vendor, not the team.
import { randomBytes, randomUUID } from "node:crypto";
import { db, logEvent } from "./db";
import { createDealFromRequest, setDealStage } from "./deals";
import { QUOTE_FIELDS, type QuoteValues } from "./quote-fields";
import { hashToken } from "./suppliers";

export type ManualClient = {
  fullName: string; email: string; phone?: string;
  street: string; city: string; state: string; zip?: string;
  propertyType: string; purchasePrice?: number; placedInService?: string; landValue?: string; notes?: string;
};

/** Saves a client and their property as a new deal. Real (not test), like a website request. */
export async function addClientByHand(c: ManualClient, addedBy: string) {
  const cityLine = [c.city, [c.state, c.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const r = await createDealFromRequest({
    requestKey: randomUUID(), fullName: c.fullName, email: c.email, phone: c.phone,
    propertyAddress: [c.street, cityLine].filter(Boolean).join(", "), propertyType: c.propertyType,
    purchasePrice: c.purchasePrice, placedInService: c.placedInService, landValue: c.landValue, notes: c.notes,
    utmSource: "Added by hand", isTest: false, source: `added by hand (${addedBy})`,
  });
  return r;
}

export type ManualQuoteResult = { ok: boolean; message: string };

/**
 * Records a vendor's quote that arrived by email. Uses the vendor's open
 * invite on this deal if there is one, otherwise adds them to the deal
 * without sending a link.
 */
export async function addQuoteByHand(dealId: string, supplierId: string, values: QuoteValues, comments: string | null,
  pdf: { filename: string; bytes: Buffer } | null, addedBy: string): Promise<ManualQuoteResult> {
  const sql = db();
  const [d] = await sql`select id, is_test, stage from deals where id = ${dealId}`;
  const [s] = await sql`select id, company_name, is_test from suppliers where id = ${supplierId}`;
  if (!d || !s) return { ok: false, message: "Pick a vendor first." };
  // Same rule as sending: a test deal never mixes with a real vendor.
  if (d.is_test && !s.is_test) return { ok: false, message: "This is a test deal, so it can only take quotes from test suppliers." };

  const cols: Record<string, unknown> = {};
  for (const f of QUOTE_FIELDS) cols[f.column] = values[f.key] ?? null;

  const saved = await sql.begin(async tx => {
    const [existing] = await tx`select id, status from supplier_invites where deal_id = ${dealId} and supplier_id = ${supplierId} for update`;
    if (existing && (existing.status === "submitted")) return "has_quote" as const;
    let inviteId: string;
    if (existing) {
      // They had a link but answered by email: close the link (no more reminders) and keep the quote.
      await tx`update supplier_invites set status = 'submitted', responded_at = now(), decline_reason = null where id = ${existing.id}`;
      inviteId = existing.id;
    } else {
      const [{ n }] = await tx`select count(*)::int n from supplier_invites where deal_id = ${dealId}`;
      if (n >= 10) return "full" as const;
      // A random token nobody ever receives, so there is no working link.
      const [inv] = await tx`
        insert into supplier_invites (deal_id, supplier_id, token_hash, due_at, status, responded_at, link_sent_count)
        values (${dealId}, ${supplierId}, ${hashToken(randomBytes(32).toString("base64url"))}, now(), 'submitted', now(), 0)
        returning id`;
      inviteId = inv.id;
    }
    await tx`insert into supplier_quotes ${tx({
      invite_id: inviteId, ...cols, comments, proposal_pdf: pdf?.bytes ?? null, proposal_filename: pdf?.filename ?? null,
      ai_status: "skipped",
    } as any)}`;
    return "ok" as const;
  });
  if (saved === "has_quote") return { ok: false, message: `${s.company_name} already has a quote on this deal.` };
  if (saved === "full") return { ok: false, message: "This deal already has the maximum of 10 vendors." };

  await logEvent(dealId, "quote_added_by_hand", { supplier: s.company_name, fee: values.fee ?? null, by: addedBy, pdf: !!pdf });
  if (["new_request", "waiting_on_quotes"].includes(d.stage)) {
    const [{ open }] = await sql`select count(*)::int open from supplier_invites where deal_id = ${dealId} and status in ('invited','viewed')`;
    if (open === 0) await setDealStage(dealId, "quotes_received");
  }
  return { ok: true, message: `${s.company_name}'s quote is saved. Nothing was emailed.` };
}
