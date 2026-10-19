// Leads posted from the main website (costsegtrust.com): real Postgres, fake email/HubSpot.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeServices } from "./fake-services";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: async () => ({ sub: "admin" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const fake = createFakeServices();
let sql: any;
let route: typeof import("../app/api/website-lead/route");
let suppliers: typeof import("../lib/suppliers");
let actions: typeof import("../app/admin/actions");

beforeAll(async () => {
  const base = await fake.listen();
  Object.assign(process.env, {
    RESEND_API_KEY: "test-resend", RESEND_API_URL: base, HUBSPOT_PRIVATE_APP_TOKEN: "test-hubspot-token", HUBSPOT_API_URL: base,
    APP_URL: "https://costsegtrust.test",
  });
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  route = await import("../app/api/website-lead/route");
  suppliers = await import("../lib/suppliers");
  actions = await import("../app/admin/actions");
});

afterAll(async () => { await fake.close(); await sql.end(); });

beforeEach(async () => {
  fake.reset();
  await sql`truncate deal_events, notifications, comparisons, supplier_quotes, supplier_invites, deals, clients restart identity cascade`;
  await sql`alter sequence deal_number_seq restart with 1001`;
});

const post = (body: unknown, origin: string | null = "https://costsegtrust.com", type = "application/json") =>
  route.POST(new Request("https://cost-seg-trust.vercel.app/api/website-lead", {
    method: "POST",
    headers: { "Content-Type": type, ...(origin ? { Origin: origin } : {}) },
    body: type.includes("json") ? JSON.stringify(body) : new URLSearchParams(body as Record<string, string>),
  }));

describe("website leads", () => {
  it("answers the browser's CORS check for the main site only", async () => {
    const ok = route.OPTIONS(new Request("https://x/api/website-lead", { method: "OPTIONS", headers: { Origin: "https://www.costsegtrust.com" } }));
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://www.costsegtrust.com");
    const other = route.OPTIONS(new Request("https://x/api/website-lead", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }));
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
    expect((await post({ name: "Jane Roe", email: "jane@example.com" }, "https://evil.example")).status).toBe(403);
    expect((await post({ name: "Jane Roe", email: "jane@example.com" }, null)).status).toBe(403);
  });

  it("turns the website's own field names into a deal in the dashboard", async () => {
    const res = await post({
      firstName: "Jane", lastName: "Roe", email: "Jane@Example.com", phone: "305-219-1907",
      address: "12 Ocean Dr", city: "Miami", state: "FL", zip: "33139", propertyType: "Apartment building",
      purchasePrice: "$2.4M", purchaseDate: "03/15/2025", message: "24 units", howDidYouHear: "Google",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://costsegtrust.com");
    expect(await res.json()).toEqual({ ok: true, reference: "CST-1001" });
    const [d] = await sql`select d.*, c.email::text as email, c.first_name, c.last_name from deals d join clients c on c.id = d.client_id`;
    expect(d).toMatchObject({ first_name: "Jane", last_name: "Roe", email: "jane@example.com", property_type: "Multifamily",
      property_address: "12 Ocean Dr, Miami, FL 33139", property_city_state: "Miami, FL 33139", is_test: false, utm_source: "costsegtrust.com" });
    expect(Number(d.purchase_price)).toBe(2400000);
    expect(d.placed_in_service.toISOString().slice(0, 10)).toBe("2025-03-15");
    expect(d.client_notes).toBe("24 units\nhowDidYouHear: Google");
    // Owner alert goes out like any other request.
    expect(fake.state.emails).toHaveLength(1);
  });

  it("saves a lead that's missing the price and date, and won't send it to suppliers until they're filled in", async () => {
    const res = await post({ name: "Sam Lee", email: "sam@example.com", yearPurchased: "2023", price: "call me" }, "https://costsegtrust.com", "application/x-www-form-urlencoded");
    expect(res.status).toBe(200);
    const [d] = await sql`select * from deals`;
    expect(d.purchase_price).toBeNull();
    expect(d.placed_in_service).toBeNull();
    expect(d.client_notes).toContain("Purchase price as entered: call me");
    expect(d.client_notes).toContain("Purchase / in-service date as entered: 2023");

    const [s] = await sql`select id from suppliers where is_test limit 1`;
    expect((await suppliers.sendDealToSuppliers(d.id, [s.id])).error).toMatch(/purchase price and in-service date/);

    const f = new FormData();
    f.append("dealId", d.id); f.append("purchasePrice", "1,250,000"); f.append("placedInService", "2023-06-01");
    await actions.setDealFacts(f);
    const [after] = await sql`select * from deals`;
    expect(Number(after.purchase_price)).toBe(1250000);
    expect((await suppliers.sendDealToSuppliers(d.id, [s.id])).invited).toBe(1);
  });

  it("marks test submissions as tests so real suppliers can never get them", async () => {
    await post({ name: "Test Lead", email: "akiva@example.com", purchasePrice: "500000", placedInService: "2025-01-02" });
    const [d] = await sql`select * from deals`;
    expect(d.is_test).toBe(true);
    // A stand-in real supplier; nothing in tests ever touches the real ones.
    const [real] = await sql`insert into suppliers (company_name, email, is_test) values ('Stand-in Real Co', 'real.standin@example.com', false)
                             on conflict (email) do update set is_test = false returning id`;
    expect((await suppliers.sendDealToSuppliers(d.id, [real.id])).error).toMatch(/test deal/);
    expect(fake.state.emails.filter(e => !String(e.to).includes("akivacohen336"))).toHaveLength(0);
  });

  it("makes one deal from a double submit, and rejects a lead with no email", async () => {
    const lead = { name: "Ana Lopez", email: "ana@example.com", address: "1 Main St, Austin, TX", price: "900000" };
    await post(lead);
    await post(lead);
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(1);
    expect((await post({ name: "No Email" })).status).toBe(422);
  });
});
