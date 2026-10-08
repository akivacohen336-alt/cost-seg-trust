// Referral partners: a referral link that tags new deals to the partner, and
// a private portal link where the partner follows the deals they brought in.
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";
import { db } from "./db";
import { supplierLocation } from "./suppliers";

export const REF_COOKIE = "cst_ref";
export const REF_COOKIE_DAYS = 365;

/** Turns a name or typed code into a link-safe code: "Smith & Co." -> "smith-co". */
export function normalizeCode(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
}
export const isCode = (s: string) => /^[a-z0-9-]{2,40}$/.test(s);

export const referralLink = (code: string) => `${config.appUrl}/r/${code}`;

// Portal links are <partner id, 32 hex><signature>. They are derived, not
// stored, so the admin can always show the link again; bumping
// link_version replaces it and the old one stops working.
function signature(id: string, version: number) {
  const secret = config.admin.sessionSecret;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(`partner-portal:${id}:${version}`).digest("base64url");
}
export function portalToken(p: { id: string; link_version: number }) {
  return p.id.replace(/-/g, "") + signature(p.id, p.link_version);
}
export const portalLink = (p: { id: string; link_version: number }) => `${config.appUrl}/partner/${portalToken(p)}`;

/** The partner a portal link belongs to, or null. Inactive partners are returned with active=false. */
export async function findPartnerByToken(token: string) {
  if (!/^[0-9a-f]{32}[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const h = token.slice(0, 32);
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  const [p] = await db()`select id, name, company, code, active, link_version from partners where id = ${id}`;
  if (!p) return null;
  const want = Buffer.from(signature(p.id, p.link_version));
  const got = Buffer.from(token.slice(32));
  return want.length === got.length && timingSafeEqual(want, got) ? p : null;
}

export async function findActivePartnerByCode(code: string) {
  const c = normalizeCode(code);
  if (!isCode(c)) return null;
  const [p] = await db()`select id, code from partners where code = ${c} and active`;
  return p ?? null;
}

/** A free code based on `wanted`: smith, smith-2, smith-3… */
export async function uniqueCode(wanted: string) {
  const base = normalizeCode(wanted).slice(0, 36) || "partner";
  const taken = new Set((await db()`select code from partners where code = ${base} or code like ${base + "-%"}`).map(r => r.code as string));
  if (!taken.has(base) && isCode(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

/** Every partner with deal counts and commission totals. */
export async function listPartners() {
  return db()`
    select p.*, p.email::text as email,
           count(d.id)::int as deals,
           count(d.id) filter (where d.stage <> 'closed')::int as open,
           count(d.id) filter (where d.closed_outcome = 'won')::int as won,
           coalesce(sum(d.partner_commission), 0) as commission_total,
           coalesce(sum(d.partner_commission) filter (where d.partner_commission_paid), 0) as commission_paid,
           max(d.created_at) as last_deal_at
    from partners p left join deals d on d.partner_id = p.id
    group by p.id
    order by p.active desc, max(d.created_at) desc nulls last, p.name`;
}

/** "Ana Lopez" -> "Ana L." Partners see no more of the client than this. */
export const clientLabel = (first: string, last: string) =>
  [first, last?.trim() ? `${last.trim()[0].toUpperCase()}.` : ""].filter(Boolean).join(" ");

/**
 * What a partner sees about the deals they referred. This is the only query
 * the partner portal uses: no client email, phone, street address or price.
 */
export async function partnerPortalDeals(partnerId: string) {
  const rows = await db()`
    select d.number, d.created_at, d.stage, d.closed_outcome, d.property_type, d.property_city_state,
           d.partner_commission, d.partner_commission_paid, c.first_name, c.last_name
    from deals d join clients c on c.id = d.client_id
    where d.partner_id = ${partnerId}
    order by d.created_at desc`;
  return rows.map(r => ({
    number: r.number as number,
    createdAt: r.created_at as Date,
    stage: r.stage as string,
    outcome: r.closed_outcome as "won" | "lost" | null,
    property: [r.property_type, supplierLocation(r.property_city_state)].filter(Boolean).join(" · "),
    client: clientLabel(r.first_name, r.last_name),
    commission: r.partner_commission == null ? null : Number(r.partner_commission),
    commissionPaid: !!r.partner_commission_paid,
  }));
}
