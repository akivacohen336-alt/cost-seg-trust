import { config } from "./config";
import { db, logEvent } from "./db";
import { associateDealWithContact, updateDealStage, upsertContact, upsertDeal } from "./hubspot";
import { notifyOwnerOfNewDeal, usd } from "./notify";
import { stageLabel, type StageKey } from "./stages";
import { cityState, splitName, type QuoteRequest } from "./validation";

export type CreateResult = { dealId: string; number: number; duplicate: boolean };

/** Saves a quote request. Idempotent on requestKey: a repeat returns the original deal. */
export async function createDealFromRequest(r: QuoteRequest): Promise<CreateResult> {
  const { first, last } = splitName(r.fullName);
  return db().begin(async tx => {
    const [client] = await tx`
      insert into clients (email, first_name, last_name, phone)
      values (${r.email}, ${first}, ${last}, ${r.phone})
      on conflict (email) do update set first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone
      returning id`;
    const [deal] = await tx`
      insert into deals (request_key, client_id, property_address, property_city_state, property_type, purchase_price,
        placed_in_service, land_value, renovation_spend, has_cpa, client_notes, consent_contact, consent_at,
        utm_source, utm_medium, utm_campaign)
      values (${r.requestKey}, ${client.id}, ${r.propertyAddress}, ${cityState(r.propertyAddress)}, ${r.propertyType},
        ${r.purchasePrice}, ${r.placedInService}, ${r.landValue ?? null}, ${r.renovationSpend ?? null},
        ${r.hasCpa ? r.hasCpa === "yes" : null}, ${r.notes ?? null}, true, now(),
        ${r.utmSource ?? null}, ${r.utmMedium ?? null}, ${r.utmCampaign ?? null})
      on conflict (request_key) do nothing
      returning id, number`;
    if (!deal) {
      const [existing] = await tx`select id, number from deals where request_key = ${r.requestKey}`;
      return { dealId: existing.id, number: existing.number, duplicate: true };
    }
    await tx`insert into deal_events (deal_id, kind, detail) values (${deal.id}, 'created', ${tx.json({ source: r.utmSource ?? "website" })})`;
    return { dealId: deal.id, number: deal.number, duplicate: false };
  });
}

/** Runs everything that happens after a new deal is saved. Never throws. */
export async function afterDealCreated(dealId: string) {
  const d = await loadDeal(dealId);
  if (!d) return;
  const results = await Promise.allSettled([
    notifyOwnerOfNewDeal({
      id: d.id, number: d.number, clientName: `${d.first_name} ${d.last_name}`.trim(), email: d.email, phone: d.phone,
      propertyType: d.property_type, address: d.property_address, purchasePrice: Number(d.purchase_price),
      placedInService: fmtDate(d.placed_in_service), landValue: d.land_value,
      renovationSpend: d.renovation_spend == null ? null : Number(d.renovation_spend), hasCpa: d.has_cpa, notes: d.client_notes,
      utm: [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(" / ") || null,
    }).then(async r => {
      await logEvent(dealId, "owner_notified", { email: r.email.status });
    }),
    syncDealToHubSpot(dealId),
  ]);
  for (const r of results) if (r.status === "rejected") console.error("afterDealCreated:", r.reason);
}

export async function loadDeal(dealId: string): Promise<any> {
  const [d] = await db()`
    select d.*, c.email::text as email, c.first_name, c.last_name, c.phone, c.hubspot_contact_id
    from deals d join clients c on c.id = d.client_id where d.id = ${dealId}`;
  return d;
}

const fmtDate = (v: Date | string) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

export function hubspotDealName(d: { number: number; property_type: string; property_address: string }) {
  return `CST-${d.number} · ${d.property_type} · ${d.property_address}`;
}

function hubspotDescription(d: any) {
  return [
    `Property: ${d.property_type} at ${d.property_address}`,
    `Purchase price: ${usd(d.purchase_price)}`,
    `Placed in service: ${fmtDate(d.placed_in_service)}`,
    `Land value: ${d.land_value ?? "—"}`,
    `Renovation spend: ${d.renovation_spend == null ? "—" : usd(d.renovation_spend)}`,
    `Has a CPA: ${d.has_cpa == null ? "—" : d.has_cpa ? "Yes" : "No"}`,
    d.client_notes ? `Client notes: ${d.client_notes}` : null,
    `Admin: ${config.appUrl}/admin/deals/${d.id}`,
  ].filter(Boolean).join("\n");
}

/** Creates or updates the HubSpot contact and deal for one of our deals. Safe to call any number of times. */
export async function syncDealToHubSpot(dealId: string): Promise<{ status: "synced" | "failed" | "skipped"; error?: string }> {
  const d = await loadDeal(dealId);
  if (!d) return { status: "failed", error: "Deal not found" };
  if (!config.hubspot.token) {
    await db()`update deals set hubspot_sync_status = 'skipped', hubspot_error = 'HubSpot not configured' where id = ${dealId}`;
    return { status: "skipped" };
  }
  try {
    const contactId = await upsertContact(
      { email: d.email, firstName: d.first_name, lastName: d.last_name, phone: d.phone },
      d.hubspot_contact_id,
    );
    if (contactId !== d.hubspot_contact_id) {
      await db()`update clients set hubspot_contact_id = ${contactId} where id = ${d.client_id}`;
    }
    const hubspotDealId = await upsertDeal(
      { requestId: d.id, name: hubspotDealName(d), stage: d.stage as StageKey, description: hubspotDescription(d) },
      d.hubspot_deal_id,
    );
    await associateDealWithContact(hubspotDealId, contactId);
    await db()`update deals set hubspot_deal_id = ${hubspotDealId}, hubspot_sync_status = 'synced',
               hubspot_synced_at = now(), hubspot_error = null where id = ${dealId}`;
    await logEvent(dealId, "hubspot_synced", { contactId, dealId: hubspotDealId });
    return { status: "synced" };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await db()`update deals set hubspot_sync_status = 'failed', hubspot_error = ${msg} where id = ${dealId}`;
    await logEvent(dealId, "hubspot_failed", { error: msg });
    return { status: "failed", error: msg };
  }
}

export async function setDealStage(dealId: string, stage: StageKey, outcome?: "won" | "lost" | null) {
  const [d] = await db()`update deals set stage = ${stage}, closed_outcome = ${stage === "closed" ? outcome ?? null : null}
                         where id = ${dealId} returning hubspot_deal_id`;
  if (!d) throw new Error("Deal not found");
  await logEvent(dealId, "stage_changed", { stage: stageLabel(stage), outcome: outcome ?? null });
  if (!config.hubspot.token) return;
  try {
    if (d.hubspot_deal_id) await updateDealStage(d.hubspot_deal_id, stage);
    else await syncDealToHubSpot(dealId);
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await db()`update deals set hubspot_sync_status = 'failed', hubspot_error = ${msg} where id = ${dealId}`;
  }
}
