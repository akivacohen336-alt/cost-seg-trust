// Phases 5-7 integration tests: suppliers, 40-hour clock, AI standardization,
// comparison, PDF approval and sending. Real Postgres; fake HubSpot, Resend,
// Twilio and Anthropic. Test suppliers only.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createFakeServices } from "./fake-services";

// Capture after() callbacks so tests can run them explicitly.
const deferred: (() => unknown)[] = [];
vi.mock("next/server", async orig => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => { deferred.push(fn); } }));

const fake = createFakeServices();
let sql: any;
let quoteRoute: typeof import("../app/api/quote-requests/route");
let supplierRoute: typeof import("../app/api/supplier-quotes/[token]/route");
let cronRoute: typeof import("../app/api/cron/deadlines/route");
let suppliers: typeof import("../lib/suppliers");
let ai: typeof import("../lib/ai");
let comparison: typeof import("../lib/comparison");
let hubspot: typeof import("../lib/hubspot");
let config: typeof import("../lib/config")["config"];

beforeAll(async () => {
  const base = await fake.listen();
  Object.assign(process.env, {
    HUBSPOT_PRIVATE_APP_TOKEN: "test-hubspot-token", HUBSPOT_API_URL: base,
    RESEND_API_KEY: "test-resend", RESEND_API_URL: base,
    TWILIO_ACCOUNT_SID: "ACtest", TWILIO_AUTH_TOKEN: "secret", TWILIO_FROM_NUMBER: "+15550001111", TWILIO_API_URL: base,
    ANTHROPIC_API_KEY: "test-anthropic-key", ANTHROPIC_BASE_URL: base,
    CRON_SECRET: "test-cron-secret",
    APP_URL: "https://costsegtrust.test",
  });
  quoteRoute = await import("../app/api/quote-requests/route");
  supplierRoute = await import("../app/api/supplier-quotes/[token]/route");
  cronRoute = await import("../app/api/cron/deadlines/route");
  sql = (await import("../lib/db")).db();
  suppliers = await import("../lib/suppliers");
  ai = await import("../lib/ai");
  comparison = await import("../lib/comparison");
  hubspot = await import("../lib/hubspot");
  config = (await import("../lib/config")).config;
});

afterAll(async () => {
  await fake.close();
  await sql.end();
});

let S: { a: string; b: string; c: string };

beforeEach(async () => {
  fake.reset();
  deferred.length = 0;
  config.resend.apiKey = "test-resend";
  config.anthropic.apiKey = "test-anthropic-key";
  await sql`truncate deal_events, notifications, pdf_reports, comparisons, supplier_quotes, supplier_invites, suppliers, deals, clients, app_settings restart identity cascade`;
  await sql`alter sequence deal_number_seq restart with 1001`;
  const rows = await sql`insert into suppliers (company_name, contact_name, email, is_test) values
    ('Test Supplier A', 'Ana', 'akivacohen336+supplier-a@gmail.com', true),
    ('Test Supplier B', 'Ben', 'akivacohen336+supplier-b@gmail.com', true),
    ('Test Supplier C', null, 'akivacohen336+supplier-c@gmail.com', true)
    returning id, company_name`;
  S = { a: rows[0].id, b: rows[1].id, c: rows[2].id };
  await hubspot.setupHubSpot();
});

async function newDeal() {
  const res = await quoteRoute.POST(new Request("http://localhost/api/quote-requests", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestKey: randomUUID(), fullName: "Dana Client", email: "dana.client@example.com", phone: "(614) 555-0142",
      propertyAddress: "118 Maple Row, Columbus, OH", propertyType: "Multifamily", purchasePrice: "2,400,000",
      placedInService: "2026-03-15", landValue: "20%", renovationSpend: "180000", hasCpa: "yes", consent: true, website: "",
    }),
  }));
  expect(res.status).toBe(200);
  const [d] = await sql`select id from deals order by number desc limit 1`;
  fake.state.emails = []; fake.state.sms = [];
  return d.id as string;
}

const tokenFrom = (email: any) => String(email.text).match(/\/q\/([A-Za-z0-9_-]+)/)![1];
const tokensBySupplier = () => Object.fromEntries(fake.state.emails.filter(e => e.to[0].includes("+supplier")).map(e => [e.to[0].match(/supplier-(\w)/)![1], tokenFrom(e)]));
const hsStage = async (label: string) => {
  const [p] = await sql`select value from app_settings where key = 'hubspot_pipeline'`;
  const pl = fake.state.pipelines.find(x => x.id === p.value.pipelineId)!;
  return pl.stages.find(s => s.label === label)!.id;
};
const stageOf = async (id: string) => (await sql`select stage from deals where id = ${id}`)[0].stage;

function submitForm(token: string, fields: Record<string, string>, pdf?: Uint8Array, name = "proposal.pdf") {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  if (pdf) f.set("proposal", new File([Buffer.from(pdf)], name, { type: "application/pdf" }));
  return supplierRoute.POST(new Request(`http://localhost/api/supplier-quotes/${token}`, { method: "POST", body: f }), { params: Promise.resolve({ token }) });
}

async function samplePdf(text: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText(text, { x: 50, y: 700, size: 12, font: await doc.embedFont(StandardFonts.Helvetica) });
  return doc.save();
}

describe("phase 5: sending to suppliers", () => {
  it("emails each test supplier a private link without the client's details and moves the deal to Waiting on Quotes", async () => {
    const dealId = await newDeal();
    const r = await suppliers.sendDealToSuppliers(dealId, [S.a, S.b, S.c]);
    expect(r).toEqual({ invited: 3, skipped: 0 });

    const sent = fake.state.emails.filter(e => e.to[0].includes("+supplier"));
    expect(sent).toHaveLength(3);
    for (const e of sent) {
      expect(e.subject).toBe("Quote request CST-1001: Multifamily in Columbus, OH");
      expect(e.text).toMatch(/https:\/\/costsegtrust\.test\/q\/[A-Za-z0-9_-]{43}/);
      for (const secret of ["Dana", "dana.client@example.com", "555-0142", "118 Maple Row"]) {
        expect(e.html).not.toContain(secret);
        expect(e.text).not.toContain(secret);
      }
      expect(e.text).toContain("$2,400,000");
    }
    // Only a hash of each link is stored.
    const toks = Object.values(tokensBySupplier());
    const invites = await sql`select token_hash, due_at, invited_at from supplier_invites`;
    for (const t of toks) expect(invites.map((i: any) => i.token_hash)).toContain(suppliers.hashToken(t as string));
    expect(JSON.stringify(invites)).not.toContain(toks[0]);
    // 40-hour window.
    const hours = (invites[0].due_at - invites[0].invited_at) / 3.6e6;
    expect(hours).toBeCloseTo(40, 1);

    expect(await stageOf(dealId)).toBe("waiting_on_quotes");
    expect(fake.state.deals[0].properties.dealstage).toBe(await hsStage("Waiting on Quotes"));
  });

  it("never invites the same supplier twice and caps a deal at 10 suppliers", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a]);
    expect(await suppliers.sendDealToSuppliers(dealId, [S.a, S.b])).toEqual({ invited: 1, skipped: 1 });
    const many = Array.from({ length: 9 }, () => randomUUID());
    const r = await suppliers.sendDealToSuppliers(dealId, many);
    expect(r.error).toMatch(/Up to 10 suppliers per deal. You can add 8 more/);
    expect((await sql`select count(*)::int n from supplier_invites`)[0].n).toBe(2);
  });

  it("does not send to inactive suppliers", async () => {
    const dealId = await newDeal();
    await sql`update suppliers set active = false where id = ${S.c}`;
    expect(await suppliers.sendDealToSuppliers(dealId, [S.b, S.c])).toEqual({ invited: 1, skipped: 1 });
  });
});

describe("phase 5: supplier responses", () => {
  it("accepts a quote once, alerts the owner, and rejects a reused link", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a, S.b]);
    const t = tokensBySupplier();
    fake.state.emails = []; fake.state.sms = [];

    expect((await suppliers.findInvite("not-a-real-token-but-long-enough-xxxxxx"))).toBeNull();
    expect((await suppliers.findInvite(t.a))!.invite.company_name).toBe("Test Supplier A");

    const bad = await submitForm(t.a, { fee: "", siteVisit: "yes" });
    expect(bad.status).toBe(422);
    const badPct = await submitForm(t.a, { fee: "4500", reclassifiedPct: "140" });
    expect(badPct.status).toBe(422);
    expect((await badPct.json()).fieldErrors.reclassifiedPct).toBeTruthy();

    const ok = await submitForm(t.a, { fee: "$4,500", studyType: "Full engineering", siteVisit: "yes", turnaroundDays: "21",
      reclassifiedPct: "28", firstYearDeduction: "560000", firstYearTaxSavings: "207200", assumedTaxRate: "37", comments: "Includes 3115" });
    expect(ok.status).toBe(200);
    const [q] = await sql`select * from supplier_quotes`;
    expect(Number(q.fee)).toBe(4500);
    expect(q.site_visit).toBe(true);
    expect(q.ai_status).toBe("skipped"); // no PDF, nothing for AI to read
    expect(deferred).toHaveLength(0);

    const owner = fake.state.emails.find(e => e.to.includes("aron.turen@gmail.com"));
    expect(owner.subject).toBe("CST-1001: Test Supplier A sent a quote ($4,500) (1 of 2 responded)");
    expect(fake.state.sms).toHaveLength(0);

    const again = await submitForm(t.a, { fee: "1" });
    expect(again.status).toBe(409);
    expect(await stageOf(dealId)).toBe("waiting_on_quotes");

    // The second response completes the set: Quotes Received.
    const dec = await submitForm(t.b, { action: "decline", reason: "At capacity" });
    expect(dec.status).toBe(200);
    expect(await stageOf(dealId)).toBe("quotes_received");
    expect(fake.state.deals[0].properties.dealstage).toBe(await hsStage("Quotes Received"));
  });

  it("rejects attachments that are not PDFs", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a]);
    const r = await submitForm(tokensBySupplier().a, { fee: "4000" }, new TextEncoder().encode("hello, not a pdf"), "x.pdf");
    expect(r.status).toBe(415);
  });
});

describe("phase 5: the 40-hour clock", () => {
  it("sends one reminder after 24 hours with a fresh link, keeps the old link working, then closes the window at 40 hours", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a, S.b]);
    const first = tokensBySupplier();
    fake.state.emails = []; fake.state.sms = [];

    expect(await suppliers.runDeadlines()).toEqual({ reminders: 0, expired: 0, closedDeals: 0 });

    await sql`update supplier_invites set invited_at = now() - interval '25 hours', due_at = now() + interval '15 hours'`;
    expect((await suppliers.runDeadlines()).reminders).toBe(2);
    expect((await suppliers.runDeadlines()).reminders).toBe(0); // never twice
    const reminders = fake.state.emails.filter(e => e.subject.startsWith("Reminder: quote request CST-1001"));
    expect(reminders).toHaveLength(2);
    const fresh = tokensBySupplier();
    expect(fresh.a).not.toBe(first.a);
    expect(await suppliers.findInvite(first.a)).not.toBeNull();
    expect(await suppliers.findInvite(fresh.a)).not.toBeNull();

    // A quotes; B never answers. At 40 hours B expires and the window closes.
    expect((await submitForm(fresh.a, { fee: "5200", firstYearTaxSavings: "190000" })).status).toBe(200);
    fake.state.emails = [];
    await sql`update supplier_invites set due_at = now() - interval '1 minute' where status <> 'submitted'`;
    expect(await suppliers.runDeadlines()).toEqual({ reminders: 0, expired: 1, closedDeals: 1 });
    expect(await suppliers.runDeadlines()).toEqual({ reminders: 0, expired: 0, closedDeals: 0 });
    expect(await stageOf(dealId)).toBe("quotes_received");
    expect(fake.state.emails.find(e => e.to.includes("aron.turen@gmail.com")).subject).toBe("CST-1001: 40-hour window closed, 1 of 2 quotes in");

    // A late supplier can still answer an expired invite.
    expect((await submitForm(first.b, { fee: "6100" })).status).toBe(200);
    const [late] = await sql`select responded_at > due_at as late from supplier_invites where supplier_id = ${S.b}`;
    expect(late.late).toBe(true);
  });

  it("keeps the deal in Waiting on Quotes when nobody quoted", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a]);
    await sql`update supplier_invites set due_at = now() - interval '1 minute'`;
    expect((await suppliers.runDeadlines()).closedDeals).toBe(1);
    expect(await stageOf(dealId)).toBe("waiting_on_quotes");
  });

  it("the scheduler endpoint needs the secret", async () => {
    const no = await cronRoute.GET(new Request("http://localhost/api/cron/deadlines"));
    expect(no.status).toBe(401);
    const yes = await cronRoute.GET(new Request("http://localhost/api/cron/deadlines", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(await yes.json()).toEqual({ ok: true, reminders: 0, expired: 0, closedDeals: 0 });
  });

  it("resending a link rotates it and is refused after a response", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a]);
    const [inv] = await sql`select id from supplier_invites`;
    const r = await suppliers.resendInvite(inv.id);
    expect(r.ok).toBe(true);
    const tok = r.link!.split("/q/")[1];
    expect((await submitForm(tok, { fee: "4000" })).status).toBe(200);
    expect((await suppliers.resendInvite(inv.id)).ok).toBe(false);
  });
});

describe("phase 6: AI standardization", () => {
  const extract = {
    fee: 5200, studyType: "Modified / desktop", siteVisit: false, turnaroundDays: 14, reclassifiedPct: 24,
    firstYearDeduction: 480000, firstYearTaxSavings: 177600, assumedTaxRate: 37, auditSupport: "Audit defense, 3 years",
    includesLookback: true, paymentTerms: "Due on delivery", validDays: 30,
    inclusions: ["Bonus depreciation schedule"], exclusions: ["Travel billed separately"], caveats: ["Assumes 20% land allocation"],
  };

  it("reads the proposal PDF: fills blanks, keeps typed values, and flags differences", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.b]);
    fake.state.aiExtract = extract;
    const pdf = await samplePdf("Proposal: fee $5,200");
    const res = await submitForm(tokensBySupplier().b, { fee: "4900", turnaroundDays: "14" }, pdf, "B proposal.pdf");
    expect(res.status).toBe(200);
    expect(deferred).toHaveLength(1);
    let [q] = await sql`select * from supplier_quotes`;
    expect(q.ai_status).toBe("pending");
    expect(q.proposal_filename).toBe("B proposal.pdf");
    await deferred[0]();

    [q] = await sql`select * from supplier_quotes`;
    expect(q.ai_status).toBe("done");
    expect(Number(q.fee)).toBe(4900); // what the supplier typed wins
    expect(Number(q.est_first_year_tax_savings)).toBe(177600); // filled from the PDF
    expect(q.ai_filled_fields).not.toContain("fee");
    expect(q.ai_filled_fields).toContain("firstYearTaxSavings");
    expect(q.ai_mismatches).toEqual([{ field: "fee", label: "Study fee", typed: 4900, pdf: 5200 }]);
    expect(q.ai_notes.exclusions).toEqual(["Travel billed separately"]);

    const call = fake.state.ai[0];
    expect(call.body.model).toBe("claude-opus-5-5");
    expect(call.body.fallbacks).toBe("default");
    expect(String(call.beta)).toContain("server-side-fallback-2026-07-01");
    expect(call.body.output_config.effort).toBe("medium");
    const blocks = call.body.messages[0].content;
    expect(blocks[0].type).toBe("document");
    expect(blocks[1].text).not.toContain("Dana");
    expect(blocks[1].text).not.toContain("118 Maple Row");

    // Re-running starts from what the supplier typed, so earlier AI fills are re-read.
    fake.state.aiExtract = { ...extract, firstYearTaxSavings: 180000 };
    expect((await ai.standardizeQuote(q.id)).status).toBe("done");
    [q] = await sql`select * from supplier_quotes`;
    expect(Number(q.est_first_year_tax_savings)).toBe(180000);
  });

  it("never fails the supplier when AI is off or declines", async () => {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a, S.b]);
    const t = tokensBySupplier();
    const pdf = await samplePdf("Proposal");

    config.anthropic.apiKey = undefined;
    expect((await submitForm(t.a, {}, pdf)).status).toBe(200);
    await deferred.pop()!();
    expect((await sql`select ai_status from supplier_quotes`)[0].ai_status).toBe("skipped");

    config.anthropic.apiKey = "test-anthropic-key";
    fake.state.aiRefuse = true;
    expect((await submitForm(t.b, { fee: "5000" }, pdf)).status).toBe(200);
    const r: any = await deferred.pop()!();
    const [q] = await sql`select ai_status, ai_error from supplier_quotes where fee = 5000`;
    expect(q.ai_status).toBe("failed");
    expect(q.ai_error).toMatch(/declined/);
    expect(r).toBeUndefined();
  });
});

describe("phase 7: comparison, approval, PDF, client", () => {
  async function dealWithQuotes() {
    const dealId = await newDeal();
    await suppliers.sendDealToSuppliers(dealId, [S.a, S.b, S.c]);
    const t = tokensBySupplier();
    await submitForm(t.a, { fee: "4500", studyType: "Full engineering", siteVisit: "yes", turnaroundDays: "21", reclassifiedPct: "28", firstYearDeduction: "560000", firstYearTaxSavings: "207200", auditSupport: "Full audit defense", includesLookback: "yes" });
    await submitForm(t.b, { fee: "3200", studyType: "Modified / desktop", siteVisit: "no", turnaroundDays: "10", reclassifiedPct: "22", firstYearDeduction: "440000", firstYearTaxSavings: "162800" });
    await submitForm(t.c, { action: "decline" });
    return dealId;
  }

  it("builds the comparison with an AI summary, takes edits, makes the PDF, and emails it after approval", async () => {
    const dealId = await dealWithQuotes();
    expect(await stageOf(dealId)).toBe("quotes_received");

    fake.state.aiSummary = "Two quotes came in.";
    expect(await comparison.buildComparison(dealId)).toEqual({ ok: true });
    expect(await stageOf(dealId)).toBe("comparison_ready");
    let view = (await comparison.loadComparison(dealId))!;
    expect(view.comparison.summary).toBe("Two quotes came in.");
    expect(view.columns.map(c => c.name)).toEqual(["Test Supplier A", "Test Supplier B"]);
    expect(view.best.fee).toBe(3200);
    expect(view.best.firstYearTaxSavings).toBe(207200);
    const summaryCall = fake.state.ai.at(-1);
    expect(summaryCall.body.output_config.effort).toBe("low");
    expect(JSON.stringify(summaryCall.body)).not.toContain("dana.client@example.com");

    // Your edits: correct a number, hide names, drop a row.
    const invA = view.quotes[0].inviteId;
    expect((await comparison.saveComparisonEdits(dealId, { overrides: { [invA]: { fee: 4400, bogus: 1 } as any }, anonymize: true, hiddenRows: ["validDays"], summary: "Edited summary." })).ok).toBe(true);
    view = (await comparison.loadComparison(dealId))!;
    expect(view.columns.map(c => c.name)).toEqual(["Provider A", "Provider B"]);
    expect(view.columns[0].values.fee).toBe(4400);
    expect(view.comparison.overrides[invA]).toEqual({ fee: 4400 });
    expect(view.rows.find(r => r.key === "validDays")).toBeUndefined();

    // Generate for approval: a real PDF, locked against edits.
    const prep = await comparison.prepareForApproval(dealId);
    expect(prep.ok).toBe(true);
    const [rep] = await sql`select * from pdf_reports`;
    expect(Buffer.from(rep.pdf).subarray(0, 5).toString()).toBe("%PDF-");
    expect(rep.filename).toBe("Cost-Seg-Trust-Comparison-CST-1001-118-Maple-Row.pdf");
    const doc = await PDFDocument.load(rep.pdf);
    expect(doc.getPageCount()).toBe(1);
    expect(await stageOf(dealId)).toBe("awaiting_approval");
    expect(fake.state.deals[0].properties.dealstage).toBe(await hsStage("Awaiting Approval"));
    expect((await comparison.saveComparisonEdits(dealId, { summary: "x" })).ok).toBe(false);

    // Nothing reaches the client before approval.
    expect(fake.state.emails.some(e => e.to[0] === "dana.client@example.com")).toBe(false);

    // Unlock, edit, regenerate: version 2.
    await comparison.unlockComparison(dealId);
    expect(await stageOf(dealId)).toBe("comparison_ready");
    await comparison.saveComparisonEdits(dealId, { anonymize: false });
    await comparison.prepareForApproval(dealId);
    expect((await sql`select max(version)::int v from pdf_reports`)[0].v).toBe(2);

    // Approve & send.
    const sent = await comparison.approveAndSend(dealId, "Hi Dana, here you go.");
    expect(sent.ok).toBe(true);
    const mail = fake.state.emails.find(e => e.to[0] === "dana.client@example.com");
    expect(mail.subject).toBe("Your cost segregation quote comparison: 118 Maple Row, Columbus, OH");
    expect(mail.reply_to).toBe("akivacohen336@gmail.com");
    expect(mail.attachments[0].filename).toBe("Cost-Seg-Trust-Comparison-CST-1001-118-Maple-Row-v2.pdf");
    expect(Buffer.from(mail.attachments[0].content, "base64").subarray(0, 5).toString()).toBe("%PDF-");
    expect(mail.text).toBe("Hi Dana, here you go.");
    expect(await stageOf(dealId)).toBe("sent_to_client");
    expect(fake.state.deals[0].properties.dealstage).toBe(await hsStage("Sent to Client"));
    const [c] = await sql`select status, sent_at from comparisons`;
    expect(c.status).toBe("sent");
    expect((await comparison.approveAndSend(dealId, "again")).ok).toBe(false); // can't double-send
  });

  it("uses a plain summary when AI is off, and won't mark sent if email isn't set up", async () => {
    const dealId = await dealWithQuotes();
    config.anthropic.apiKey = undefined;
    await comparison.buildComparison(dealId);
    const view = (await comparison.loadComparison(dealId))!;
    expect(view.comparison.summary).toBe("We received 2 quotes for your multifamily property. Fees range from $3,200 to $4,500. Estimated first-year tax savings range from $162,800 to $207,200. Test Supplier B offers the most estimated savings per dollar of fee. Test Supplier B is fastest at 10 days.");

    expect((await comparison.approveAndSend(dealId, "")).ok).toBe(false); // not generated yet
    await comparison.prepareForApproval(dealId);
    config.resend.apiKey = undefined;
    const r = await comparison.approveAndSend(dealId, "");
    expect(r).toEqual({ ok: false, error: "Email isn't set up yet, so nothing was sent." });
    expect(await stageOf(dealId)).toBe("awaiting_approval");
  });

  it("refuses to build a comparison with no quotes", async () => {
    const dealId = await newDeal();
    expect(await comparison.buildComparison(dealId)).toEqual({ ok: false, error: "No supplier quotes yet." });
  });
});

describe("real suppliers and test deals", () => {
  it("never sends a test deal, its reminder or a resent link to a real supplier", async () => {
    const [real] = await sql`insert into suppliers (company_name, email, is_test) values ('Real Co', 'real@example.com', false) returning id`;
    const dealId = await newDeal();
    await sql`update deals set is_test = true where id = ${dealId}`;
    fake.state.emails = [];
    const r = await suppliers.sendDealToSuppliers(dealId, [real.id, S.a]);
    expect(r.error).toMatch(/test deal/);
    expect(fake.state.emails).toHaveLength(0);

    // Even an invite that somehow exists gets no reminder or resent link.
    const [inv] = await sql`insert into supplier_invites (deal_id, supplier_id, token_hash, invited_at, due_at)
      values (${dealId}, ${real.id}, 'x', now() - interval '30 hours', now() + interval '10 hours') returning id`;
    await suppliers.runDeadlines();
    expect((await suppliers.resendInvite(inv.id)).ok).toBe(false);
    expect(fake.state.emails.filter((e: any) => e.to.includes("real@example.com"))).toHaveLength(0);

    // Test suppliers still work on a test deal, and real deals can reach real suppliers.
    expect((await suppliers.sendDealToSuppliers(dealId, [S.a])).invited).toBe(1);
    const realDeal = await newDeal();
    expect((await suppliers.sendDealToSuppliers(realDeal, [real.id])).invited).toBe(1);
  });
});
