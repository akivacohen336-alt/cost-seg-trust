// Stage 1 integration tests: real Postgres, fake HubSpot/Resend/Twilio.
// Run with DATABASE_URL pointing at a disposable database.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createFakeServices } from "./fake-services";

const fake = createFakeServices();
let POST: (req: Request) => Promise<Response>;
let sql: any;
let deals: typeof import("../lib/deals");
let hubspot: typeof import("../lib/hubspot");
let config: typeof import("../lib/config")["config"];

beforeAll(async () => {
  const base = await fake.listen();
  Object.assign(process.env, {
    HUBSPOT_PRIVATE_APP_TOKEN: "test-hubspot-token", HUBSPOT_API_URL: base,
    RESEND_API_KEY: "test-resend", RESEND_API_URL: base,
    TWILIO_ACCOUNT_SID: "ACtest", TWILIO_AUTH_TOKEN: "secret", TWILIO_FROM_NUMBER: "+15550001111", TWILIO_API_URL: base,
    APP_URL: "https://costsegtrust.test",
  });
  ({ POST } = await import("../app/api/quote-requests/route"));
  sql = (await import("../lib/db")).db();
  deals = await import("../lib/deals");
  hubspot = await import("../lib/hubspot");
  config = (await import("../lib/config")).config;
});

afterAll(async () => {
  await fake.close();
  await sql.end();
});

beforeEach(async () => {
  fake.reset();
  config.hubspot.token = "test-hubspot-token";
  await sql`truncate deal_events, notifications, comparisons, supplier_quotes, supplier_invites, deals, clients, app_settings restart identity cascade`;
  await sql`alter sequence deal_number_seq restart with 1001`;
});

const form = (over: Record<string, unknown> = {}) => ({
  requestKey: randomUUID(),
  fullName: "Test Client",
  email: "test.client@example.com",
  phone: "(614) 555-0142",
  propertyAddress: "118 Maple Row, Columbus, OH",
  propertyType: "Multifamily",
  purchasePrice: "2,400,000",
  placedInService: "2026-03-15",
  landValue: "20%",
  renovationSpend: "180000",
  hasCpa: "yes",
  notes: "24 units",
  consent: true,
  utmSource: "sms", utmCampaign: "oct-investors",
  website: "",
  ...over,
});

const submit = (body: unknown) =>
  POST(new Request("http://localhost/api/quote-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

describe("quote request → deal", () => {
  it("creates the deal, alerts the owner, and creates the HubSpot contact and deal", async () => {
    const res = await submit(form());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, reference: "CST-1001" });

    const [d] = await sql`select d.*, c.email::text as email, c.hubspot_contact_id from deals d join clients c on c.id = d.client_id`;
    expect(d.stage).toBe("new_request");
    expect(Number(d.purchase_price)).toBe(2400000);
    expect(d.property_city_state).toBe("Columbus, OH");
    expect(d.utm_source).toBe("sms");
    expect(d.consent_contact).toBe(true);

    // Owner alert: one email to the owner's inbox, one text to the owner's phone.
    expect(fake.state.emails).toHaveLength(1);
    expect(fake.state.emails[0].to).toEqual(["akivacohen336@gmail.com"]);
    expect(fake.state.emails[0].subject).toBe("New deal #1001: Multifamily at 118 Maple Row, Columbus, OH, $2,400,000");
    expect(fake.state.emails[0].html).toContain(`https://costsegtrust.test/admin/deals/${d.id}`);
    expect(fake.state.sms).toHaveLength(1);
    expect(fake.state.sms[0].To).toBe("+13052191907");
    const notes = await sql`select channel, status from notifications order by channel`;
    expect(notes.map((n: any) => `${n.channel}:${n.status}`)).toEqual(["email:sent", "sms:sent"]);

    // HubSpot: pipeline + unique property set up on first use, one contact, one deal, associated.
    expect(fake.state.pipelines).toHaveLength(1);
    expect(fake.state.pipelines[0].stages.map(s => s.label)).toEqual([
      "New Request", "Waiting on Quotes", "Quotes Received", "Comparison Ready", "Awaiting Approval", "Sent to Client", "Closed",
    ]);
    expect(fake.state.properties).toEqual([expect.objectContaining({ name: "cst_request_id", hasUniqueValue: true })]);
    expect(fake.state.contacts).toHaveLength(1);
    expect(fake.state.contacts[0].properties).toMatchObject({ email: "test.client@example.com", firstname: "Test", lastname: "Client" });
    expect(fake.state.deals).toHaveLength(1);
    const hd = fake.state.deals[0];
    expect(hd.properties.dealname).toBe("CST-1001 · Multifamily · 118 Maple Row, Columbus, OH");
    expect(hd.properties.cst_request_id).toBe(d.id);
    expect(hd.properties.pipeline).toBe(fake.state.pipelines[0].id);
    expect(hd.properties.dealstage).toBe(fake.state.pipelines[0].stages[0].id);
    expect(fake.state.associations).toEqual([{ dealId: hd.id, contactId: fake.state.contacts[0].id }]);
    expect(d.hubspot_deal_id).toBe(hd.id);
    expect(d.hubspot_contact_id).toBe(fake.state.contacts[0].id);
    expect(d.hubspot_sync_status).toBe("synced");
  });

  it("does not create a second deal when the same form is submitted twice", async () => {
    const body = form();
    await submit(body);
    const again = await submit(body);
    expect(await again.json()).toEqual({ ok: true, reference: "CST-1001" });
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(1);
    expect(fake.state.deals).toHaveLength(1);
    expect(fake.state.emails).toHaveLength(1);
    expect(fake.state.sms).toHaveLength(1);
  });

  it("reuses one contact for a returning client with a second property", async () => {
    await submit(form());
    await submit(form({ email: "Test.Client@Example.com", phone: "305-555-0100", propertyAddress: "9 Bay Rd, Miami, FL", propertyType: "Short-term rental" }));
    expect((await sql`select count(*)::int n from clients`)[0].n).toBe(1);
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(2);
    expect(fake.state.contacts).toHaveLength(1);
    expect(fake.state.contacts[0].properties.phone).toBe("305-555-0100"); // updated, not duplicated
    expect(fake.state.deals).toHaveLength(2);
    expect(fake.state.associations).toHaveLength(2);
  });

  it("links to a contact that already exists in HubSpot instead of creating one", async () => {
    fake.state.contacts.push({ id: "555", properties: { email: "test.client@example.com", firstname: "Old", lastname: "Name", lifecyclestage: "lead" } });
    await submit(form());
    expect(fake.state.contacts).toHaveLength(1);
    expect(fake.state.contacts[0].properties.firstname).toBe("Test");
    expect(fake.state.contacts[0].properties.lifecyclestage).toBe("lead"); // other HubSpot fields untouched
    expect(fake.state.associations[0].contactId).toBe("555");
  });

  it("handles HubSpot's 'contact already exists' answer without a duplicate", async () => {
    fake.state.contacts.push({ id: "777", properties: { email: "test.client@example.com", firstname: "X", lastname: "Y" } });
    fake.state.hideNextContactLookup = true; // lookup misses, create gets a 409
    await submit(form());
    expect(fake.state.contacts).toHaveLength(1);
    expect(fake.state.associations[0].contactId).toBe("777");
    expect((await sql`select hubspot_sync_status s from deals`)[0].s).toBe("synced");
  });

  it("never duplicates the HubSpot deal, even if our saved HubSpot id is lost", async () => {
    await submit(form());
    const [d] = await sql`select id from deals`;
    await sql`update deals set hubspot_deal_id = null`; // e.g. crash right after HubSpot answered
    await deals.syncDealToHubSpot(d.id);
    await deals.syncDealToHubSpot(d.id);
    expect(fake.state.deals).toHaveLength(1);
    expect((await sql`select hubspot_deal_id from deals`)[0].hubspot_deal_id).toBe(fake.state.deals[0].id);
    expect(fake.state.associations).toHaveLength(1);
  });

  it("the unique request id blocks a duplicate even if a create slips through", async () => {
    await submit(form());
    const [d] = await sql`select id from deals`;
    const before = fake.state.deals.length;
    // Direct create with the same request id is refused by "HubSpot".
    const res = await fetch(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/deals`, {
      method: "POST", headers: { Authorization: "Bearer test-hubspot-token", "Content-Type": "application/json" },
      body: JSON.stringify({ properties: { dealname: "dupe", cst_request_id: d.id } }),
    });
    expect(res.status).toBe(400);
    expect(fake.state.deals).toHaveLength(before);
  });

  it("moves the HubSpot deal when the stage changes", async () => {
    await submit(form());
    const [d] = await sql`select id from deals`;
    await deals.setDealStage(d.id, "waiting_on_quotes");
    const stages = fake.state.pipelines[0].stages;
    expect(fake.state.deals[0].properties.dealstage).toBe(stages.find(s => s.label === "Waiting on Quotes")!.id);
    await deals.setDealStage(d.id, "closed", "won");
    expect(fake.state.deals[0].properties.dealstage).toBe(stages.find(s => s.label === "Closed")!.id);
    expect((await sql`select stage, closed_outcome from deals`)[0]).toMatchObject({ stage: "closed", closed_outcome: "won" });
  });

  it("still saves the deal and alerts the owner when HubSpot is down, then syncs on retry", async () => {
    fake.state.failHubSpot = 100;
    const res = await submit(form());
    expect(res.status).toBe(200);
    const [d] = await sql`select id, hubspot_sync_status, hubspot_error from deals`;
    expect(d.hubspot_sync_status).toBe("failed");
    expect(d.hubspot_error).toContain("500");
    expect(fake.state.emails).toHaveLength(1);
    expect(fake.state.sms).toHaveLength(1);
    fake.state.failHubSpot = 0;
    expect((await deals.syncDealToHubSpot(d.id)).status).toBe("synced");
    await deals.syncDealToHubSpot(d.id);
    expect(fake.state.deals).toHaveLength(1);
    expect(fake.state.contacts).toHaveLength(1);
  });

  it("recovers from a brief HubSpot outage automatically", async () => {
    fake.state.failHubSpot = 2; // retried inside the client
    await submit(form());
    expect((await sql`select hubspot_sync_status s from deals`)[0].s).toBe("synced");
    expect(fake.state.deals).toHaveLength(1);
  });

  it("skips HubSpot cleanly when it isn't connected", async () => {
    config.hubspot.token = undefined;
    await submit(form());
    expect((await sql`select hubspot_sync_status s from deals`)[0].s).toBe("skipped");
    expect(fake.state.calls).toHaveLength(0);
  });

  it("HubSpot setup is safe to run repeatedly", async () => {
    await hubspot.setupHubSpot();
    await hubspot.setupHubSpot();
    expect(fake.state.pipelines).toHaveLength(1);
    expect(fake.state.pipelines[0].stages).toHaveLength(7);
    expect(fake.state.properties).toHaveLength(1);
    expect(fake.state.pipelines[0].stages.at(-1)!.metadata).toMatchObject({ isClosed: "true", probability: "1.0" });
  });

  it("adds missing stages to an existing pipeline instead of making a new one", async () => {
    fake.state.pipelines.push({ id: "p1", label: "Cost Seg Trust", stages: [{ id: "s1", label: "New Request", metadata: {} }] });
    await hubspot.setupHubSpot();
    expect(fake.state.pipelines).toHaveLength(1);
    expect(fake.state.pipelines[0].stages.map(s => s.label)).toHaveLength(7);
    expect(fake.state.pipelines[0].stages[0].id).toBe("s1");
  });
});

describe("form validation", () => {
  it("rejects missing and invalid fields with friendly messages", async () => {
    const res = await submit(form({ email: "nope", phone: "123", purchasePrice: "", consent: false, fullName: "" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual(["consent", "email", "fullName", "phone", "purchasePrice"]);
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(0);
  });

  it("rejects property types not on the list", async () => {
    const res = await submit(form({ propertyType: "Castle" }));
    expect(res.status).toBe(422);
  });

  it("silently drops bot submissions caught by the hidden field", async () => {
    const res = await submit(form({ website: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect((await sql`select count(*)::int n from deals`)[0].n).toBe(0);
    expect(fake.state.emails).toHaveLength(0);
  });

  it("skips alerts cleanly when email and texting aren't connected", async () => {
    const saved = { ...config.resend }, savedT = { ...config.twilio };
    config.resend.apiKey = undefined; config.twilio.accountSid = undefined;
    try {
      await submit(form());
      const notes = await sql`select channel, status from notifications order by channel`;
      expect(notes.map((n: any) => `${n.channel}:${n.status}`)).toEqual(["email:skipped", "sms:skipped"]);
      expect((await sql`select count(*)::int n from deals`)[0].n).toBe(1);
    } finally {
      Object.assign(config.resend, saved); Object.assign(config.twilio, savedT);
    }
  });
});

describe("database", () => {
  it("has the three test suppliers, all marked as test", async () => {
    const rows = await sql`select company_name, email::text, is_test from suppliers order by company_name`;
    expect(rows.filter((r: any) => r.is_test)).toHaveLength(3);
    expect(rows.every((r: any) => !r.is_test || r.email.startsWith("akivacohen336+supplier-"))).toBe(true);
  });

  it("locks every table behind row level security", async () => {
    const open = await sql`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    expect(open).toEqual([]);
  });
});
