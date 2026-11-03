// Clients and vendor quotes typed in on the dashboard: real Postgres, no email ever sent.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: async () => ({ email: "aron.turen@gmail.com", owner: false }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw Object.assign(new Error("REDIRECT"), { to }); } }));

let sql: any;
let clientActions: typeof import("../app/admin/client-actions");
let dealActions: typeof import("../app/admin/deal-actions");
const fetchSpy = vi.fn(async () => new Response("{}"));

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchSpy);
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  clientActions = await import("../app/admin/client-actions");
  dealActions = await import("../app/admin/deal-actions");
});
afterAll(async () => { await sql`delete from suppliers where email::text like '%@manual-test.example'`; await sql.end(); });

const form = (fields: Record<string, string | File>) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); return f; };
const client = {
  fullName: "Dana Client", email: "Dana.Client@example.com", phone: "(305) 555-0100",
  street: "100 Example Ave", city: "Austin", state: "TX", zip: "78701", propertyType: "Multifamily",
  purchasePrice: "$2,400,000", placedInService: "2025-06-15", notes: "Called in",
};
async function addClient(fields: Record<string, string> = client) {
  try { return await clientActions.addClientAction(null, form(fields)); } catch (e: any) { if (e.message === "REDIRECT") return { to: e.to as string }; throw e; }
}
let real: string, real2: string, test: string;

beforeEach(async () => {
  await sql`truncate client_files, deal_events, notifications, pdf_reports, comparisons, supplier_quotes, supplier_invites, deals, clients restart identity cascade`;
  await sql`delete from suppliers where email::text like '%@manual-test.example'`;
  fetchSpy.mockClear();
  [{ id: real }, { id: real2 }, { id: test }] = await sql`insert into suppliers (company_name, email, is_test) values
    ('Real Co', 'real@manual-test.example', false), ('Other Real Co', 'other@manual-test.example', false), ('Test Co', 'test@manual-test.example', true) returning id`;
});

describe("Add client", () => {
  it("makes a real deal for the client and emails nobody", async () => {
    const r: any = await addClient();
    expect(r.to).toMatch(/^\/admin\/deals\/[0-9a-f-]{36}$/);
    const [d] = await sql`select d.*, c.email, c.first_name, c.last_name from deals d join clients c on c.id = d.client_id`;
    expect(d).toMatchObject({ email: "dana.client@example.com", first_name: "Dana", last_name: "Client", is_test: false,
      property_address: "100 Example Ave, Austin, TX 78701", property_city_state: "Austin, TX 78701", stage: "new_request", utm_source: "Added by hand" });
    expect(Number(d.purchase_price)).toBe(2400000);
    expect((await sql`select count(*)::int n from notifications`)[0].n).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("says what is missing", async () => {
    expect(await addClient({ ...client, email: "nope" })).toEqual({ error: "Enter the client's email." });
    expect(await addClient({ ...client, city: "" })).toEqual({ error: "Enter the property's street, city and state." });
    expect(await addClient({ ...client, purchasePrice: "lots" })).toEqual({ error: "The purchase price isn't a number." });
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(0);
  });
});

describe("Add a quote by hand", () => {
  let dealId: string;
  beforeEach(async () => { dealId = ((await addClient()) as any).to.split("/").pop(); });
  const quote = (supplierId: string, extra: Record<string, string | File> = {}) =>
    dealActions.addQuoteByHandAction(null, form({ dealId, supplierId, fee: "$14,500", firstYearTaxSavings: "1,262,690", taxBenefitOn: "total", siteVisit: "yes", ...extra }));

  it("saves the vendor's numbers and PDF without emailing anyone or making a working link", async () => {
    const pdf = new File([Buffer.from("%PDF-1.4 test")], "CRE proposal.pdf", { type: "application/pdf" });
    const r = await quote(real, { proposal: pdf });
    expect(r.ok).toBe(true);
    const [q] = await sql`select q.*, i.status, i.link_sent_count from supplier_quotes q join supplier_invites i on i.id = q.invite_id`;
    expect(q).toMatchObject({ status: "submitted", link_sent_count: 0, site_visit: true, tax_benefit_on: "total", proposal_filename: "CRE proposal.pdf", ai_status: "skipped" });
    expect(Number(q.fee)).toBe(14500);
    expect((await sql`select stage from deals`)[0].stage).toBe("quotes_received");
    expect((await sql`select count(*)::int n from notifications`)[0].n).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("fills in a vendor who was sent a link but answered by email", async () => {
    await sql`insert into supplier_invites (deal_id, supplier_id, token_hash, link_sent_count) values (${dealId}, ${real2}, 'x', 1)`;
    expect((await quote(real2)).ok).toBe(true);
    const invites = await sql`select status from supplier_invites`;
    expect(invites).toHaveLength(1);
    expect(invites[0].status).toBe("submitted");
  });
  it("won't add a second quote for the same vendor, or a real vendor on a test deal", async () => {
    await quote(real);
    expect(await quote(real)).toEqual({ ok: false, message: "Real Co already has a quote on this deal." });
    await sql`update deals set is_test = true`;
    expect((await quote(real2)).ok).toBe(false);
    expect((await quote(test)).ok).toBe(true);
  });
  it("needs the fee and plain numbers", async () => {
    expect((await quote(real, { fee: "" })).message).toBe("Enter the vendor's fee.");
    expect((await quote(real, { fee: "about 5k" })).ok).toBe(false);
    expect((await sql`select count(*)::int n from supplier_quotes`)[0].n).toBe(0);
  });
});
