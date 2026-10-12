// Referral partners: real Postgres, fake email/HubSpot, admin session mocked.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createFakeServices } from "./fake-services";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: async () => ({ sub: "admin" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { url }); }, notFound: () => { throw new Error("NOT_FOUND"); } }));

const fake = createFakeServices();
let sql: any;
let POST: (req: Request) => Promise<Response>;
let refRoute: typeof import("../app/r/[code]/route");
let partners: typeof import("../lib/partners");
let actions: typeof import("../app/admin/partner-actions");
let deals: typeof import("../lib/deals");

beforeAll(async () => {
  const base = await fake.listen();
  Object.assign(process.env, {
    RESEND_API_KEY: "test-resend", RESEND_API_URL: base, HUBSPOT_PRIVATE_APP_TOKEN: "test-hubspot-token", HUBSPOT_API_URL: base,
    APP_URL: "https://costsegtrust.test", SESSION_SECRET: process.env.SESSION_SECRET ?? "x".repeat(40),
  });
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  ({ POST } = await import("../app/api/quote-requests/route"));
  refRoute = await import("../app/r/[code]/route");
  partners = await import("../lib/partners");
  actions = await import("../app/admin/partner-actions");
  deals = await import("../lib/deals");
});

afterAll(async () => { await fake.close(); await sql.end(); });

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}
async function addPartner(fields: Record<string, string>) {
  const err = await actions.addPartner(form(fields)).catch(e => e);
  const id = String(err.url).split("/").pop()!;
  const [p] = await sql`select * from partners where id = ${id}`;
  return p;
}
const quote = (over: Record<string, unknown> = {}, cookie?: string) => POST(new Request("http://x/api/quote-requests", {
  method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
  body: JSON.stringify({
    requestKey: randomUUID(), fullName: "Ana Lopez", email: `ana${Math.random()}@example.com`, phone: "(305) 219-1907",
    propertyAddress: "12 Ocean Dr, Miami, FL 33139", propertyType: "Multifamily", purchasePrice: "2,500,000",
    placedInService: "2026-01-15", consent: true, website: "", ...over,
  }),
}));
const lastDeal = async () => (await sql`select * from deals order by number desc limit 1`)[0];

beforeEach(async () => {
  fake.reset();
  await sql`truncate client_files, contact_messages, deal_events, notifications, pdf_reports, comparisons, supplier_quotes, supplier_invites, deals, clients, partners restart identity cascade`;
  await sql`alter sequence deal_number_seq restart with 1001`;
});

describe("partner codes", () => {
  it("makes link-safe codes and never reuses one", async () => {
    expect(partners.normalizeCode("Smith & Co. Realty!")).toBe("smith-co-realty");
    const a = await addPartner({ name: "Jane Smith" });
    const b = await addPartner({ name: "Jane Smith", company: "Other" });
    const c = await addPartner({ name: "Someone", code: "Jane Smith" });
    expect([a.code, b.code, c.code]).toEqual(["jane-smith", "jane-smith-2", "jane-smith-3"]);
  });
});

describe("referral link", () => {
  it("remembers the partner and sends the client to the quote form", async () => {
    await addPartner({ name: "Jane Smith" });
    const res = await refRoute.GET(new Request("https://costsegtrust.test/r/Jane-Smith"), { params: Promise.resolve({ code: "Jane-Smith" }) });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://costsegtrust.test/quote?ref=jane-smith");
    expect(res.headers.get("set-cookie")).toMatch(/cst_ref=jane-smith;.*Max-Age=31536000/i);
  });
  it("sends unknown or inactive codes to the plain form without a cookie", async () => {
    const p = await addPartner({ name: "Jane Smith" });
    await actions.togglePartner(form({ id: p.id }));
    for (const code of ["jane-smith", "nobody"]) {
      const res = await refRoute.GET(new Request(`https://costsegtrust.test/r/${code}`), { params: Promise.resolve({ code }) });
      expect(res.headers.get("location")).toBe("https://costsegtrust.test/quote");
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });
});

describe("tagging deals", () => {
  it("tags a deal from the form's ref, or from the cookie, and tells the owner", async () => {
    const p = await addPartner({ name: "Jane Smith", company: "Smith Realty" });
    expect((await quote({ ref: "Jane-Smith" })).status).toBe(200);
    expect((await lastDeal()).partner_id).toBe(p.id);
    expect(fake.state.emails[0].text).toContain("Referred by: Jane Smith (Smith Realty)");
    await quote({}, "other=1; cst_ref=jane-smith");
    expect((await lastDeal()).partner_id).toBe(p.id);
  });
  it("credits a referred client's later deals to the partner who first referred them", async () => {
    const a = await addPartner({ name: "Partner A" });
    const b = await addPartner({ name: "Partner B" });
    await quote({ ref: "partner-a", email: "ana@example.com" });
    await quote({ email: "ana@example.com" });                 // comes back without any link
    expect((await lastDeal()).partner_id).toBe(a.id);
    await quote({ ref: "partner-b", email: "ana@example.com" }); // another partner's link later
    expect((await lastDeal()).partner_id).toBe(a.id);
    expect((await partners.partnerPortalDeals(a.id))).toHaveLength(3);
    expect((await partners.partnerPortalDeals(b.id))).toHaveLength(0);
  });
  it("keeps a client tagged by hand with that partner", async () => {
    const p = await addPartner({ name: "Jane Smith" });
    await quote({ email: "ben@example.com" });
    await actions.setDealPartner(form({ dealId: (await lastDeal()).id, partnerId: p.id }));
    await quote({ email: "ben@example.com" });
    expect((await lastDeal()).partner_id).toBe(p.id);
  });
  it("leaves deals untagged without a valid, active partner", async () => {
    const p = await addPartner({ name: "Jane Smith" });
    await quote();
    expect((await lastDeal()).partner_id).toBeNull();
    await quote({ ref: "nobody" });
    expect((await lastDeal()).partner_id).toBeNull();
    await actions.togglePartner(form({ id: p.id }));
    await quote({ ref: "jane-smith" });
    expect((await lastDeal()).partner_id).toBeNull();
    expect(fake.state.emails.every((e: any) => !e.text.includes("Referred by"))).toBe(true);
  });
  it("lets the admin tag, retag and clear a deal, and record commission", async () => {
    const p = await addPartner({ name: "Jane Smith" });
    await quote();
    const d = await lastDeal();
    await actions.setDealPartner(form({ dealId: d.id, partnerId: p.id }));
    expect((await lastDeal()).partner_id).toBe(p.id);
    await actions.saveCommission(form({ dealId: d.id, amount: "$1,250", paid: "on" }));
    const [row] = await partners.listPartners();
    expect(row.deals).toBe(1);
    expect(Number(row.commission_total)).toBe(1250);
    expect(Number(row.commission_paid)).toBe(1250);
    await actions.setDealPartner(form({ dealId: d.id, partnerId: "" }));
    expect((await lastDeal()).partner_id).toBeNull();
    const events = await sql`select detail from deal_events where deal_id = ${d.id} and kind = 'partner_set' order by id`;
    expect(events.map((e: any) => e.detail.partner)).toEqual(["Jane Smith", null]);
  });
});

describe("partner page", () => {
  it("opens only with the current link, and shows no client contact details or price", async () => {
    const p = await addPartner({ name: "Jane Smith" });
    await quote({ ref: "jane-smith", email: "ana@example.com" });
    const token = partners.portalToken(p);
    expect((await partners.findPartnerByToken(token))?.id).toBe(p.id);
    expect(await partners.findPartnerByToken(token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(await partners.findPartnerByToken("nonsense")).toBeNull();

    const rows = await partners.partnerPortalDeals(p.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ number: 1001, client: "Ana L.", property: "Multifamily · Miami, FL", stage: "new_request" });
    const shown = JSON.stringify(rows);
    for (const secret of ["ana@example.com", "Lopez", "305", "Ocean", "2500000", "33139"]) expect(shown).not.toContain(secret);

    await actions.replacePortalLink(form({ id: p.id }));
    expect(await partners.findPartnerByToken(token)).toBeNull();
    const [fresh] = await sql`select * from partners where id = ${p.id}`;
    expect((await partners.findPartnerByToken(partners.portalToken(fresh)))?.id).toBe(p.id);
  });
  it("doesn't show one partner's deals to another", async () => {
    const a = await addPartner({ name: "Partner A" });
    const b = await addPartner({ name: "Partner B" });
    await quote({ ref: "partner-a" });
    expect(await partners.partnerPortalDeals(a.id)).toHaveLength(1);
    expect(await partners.partnerPortalDeals(b.id)).toHaveLength(0);
  });
});

describe("suppliers", () => {
  it("never see who referred a deal", async () => {
    await addPartner({ name: "Jane Smith", company: "Smith Realty" });
    await quote({ ref: "jane-smith" });
    const d = await deals.loadDeal((await lastDeal()).id);
    const { supplierFacts } = await import("../lib/suppliers");
    expect(JSON.stringify(supplierFacts(d))).not.toMatch(/Smith/);
  });
});
