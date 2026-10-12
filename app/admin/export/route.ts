import { db } from "@/lib/db";
import { PROPERTY_TYPES, isStageKey, stageLabel } from "@/lib/stages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Protected by middleware (all /admin routes require the admin session).
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const stage = sp.get("stage") && isStageKey(sp.get("stage")!) ? sp.get("stage") : null;
  const type = sp.get("type") && (PROPERTY_TYPES as readonly string[]).includes(sp.get("type")!) ? sp.get("type") : null;
  const q = sp.get("q")?.trim();
  const like = q ? `%${q}%` : null;
  const rows = await db()`
    select d.number, d.created_at, d.stage, c.first_name, c.last_name, c.email::text as email, c.phone,
           d.property_type, d.property_address, d.purchase_price, d.placed_in_service, d.land_value, d.renovation_spend,
           d.has_cpa, d.utm_source, d.utm_medium, d.utm_campaign, d.hubspot_deal_id,
           p.name as partner_name, d.partner_commission, d.partner_commission_paid
    from deals d join clients c on c.id = d.client_id left join partners p on p.id = d.partner_id
    where (${stage}::deal_stage is null or d.stage = ${stage}::deal_stage)
      and (${type}::text is null or d.property_type = ${type})
      and (${like}::text is null or c.first_name || ' ' || c.last_name ilike ${like} or c.email ilike ${like}
           or d.property_address ilike ${like} or ('CST-' || d.number) ilike ${like})
    order by d.created_at desc`;
  const head = ["Deal", "Received", "Stage", "First name", "Last name", "Email", "Phone", "Property type", "Address",
    "Purchase price", "Placed in service", "Land value", "Renovation spend", "Has CPA", "UTM source", "UTM medium", "UTM campaign", "HubSpot deal",
    "Partner", "Partner commission", "Commission paid"];
  const cell = (v: unknown) => {
    let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // keep spreadsheet formulas from running
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map(r => [
    `CST-${r.number}`, r.created_at, stageLabel(r.stage), r.first_name, r.last_name, r.email, r.phone, r.property_type,
    r.property_address, r.purchase_price, r.placed_in_service instanceof Date ? r.placed_in_service.toISOString().slice(0, 10) : r.placed_in_service,
    r.land_value, r.renovation_spend, r.has_cpa == null ? "" : r.has_cpa ? "Yes" : "No", r.utm_source, r.utm_medium, r.utm_campaign, r.hubspot_deal_id,
    r.partner_name, r.partner_commission, r.partner_name ? (r.partner_commission_paid ? "Yes" : "No") : "",
  ].map(cell).join(","));
  const csv = [head.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cost-seg-trust-deals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
