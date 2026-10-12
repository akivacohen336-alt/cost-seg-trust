// Client folders and search: real Postgres, admin session mocked.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: async () => ({ sub: "admin" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let sql: any;
let clients: typeof import("../lib/clients");
let actions: typeof import("../app/admin/client-actions");
let fileRoute: typeof import("../app/admin/files/client/[id]/route");

beforeAll(async () => {
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  clients = await import("../lib/clients");
  actions = await import("../app/admin/client-actions");
  fileRoute = await import("../app/admin/files/client/[id]/route");
});

afterAll(async () => { await sql.end(); });

let ana: string, ben: string, anaDeal: string, benDeal: string;

async function client(first: string, last: string, email: string, phone: string) {
  const [c] = await sql`insert into clients (first_name, last_name, email, phone) values (${first}, ${last}, ${email}, ${phone}) returning id`;
  return c.id as string;
}
async function deal(clientId: string, address: string) {
  const [d] = await sql`insert into deals (request_key, client_id, property_address, property_type, purchase_price, placed_in_service, consent_contact, consent_at)
    values (${randomUUID()}, ${clientId}, ${address}, 'Multifamily', 2500000, '2025-06-01', true, now()) returning id`;
  return d.id as string;
}
function form(fields: Record<string, string | File>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

beforeEach(async () => {
  await sql`truncate client_files, contact_messages, deal_events, notifications, pdf_reports, comparisons, supplier_quotes, supplier_invites, deals, clients restart identity cascade`;
  await sql`alter sequence deal_number_seq restart with 1001`;
  ana = await client("Ana", "Lopez", "ana@example.com", "(305) 219-1907");
  ben = await client("Ben", "Stone", "ben@example.com", "+1 212 555 0100");
  anaDeal = await deal(ana, "12 Ocean Dr, Miami");   // CST-1001
  benDeal = await deal(ben, "400 Park Ave, New York"); // CST-1002
});

describe("searchClients", () => {
  const names = async (q: string | null) => (await clients.searchClients(q)).map((r: any) => r.first_name).sort();
  it("lists everyone without a query", async () => expect(await names(null)).toEqual(["Ana", "Ben"]));
  it("finds by full name, email, phone digits, address and CST number", async () => {
    expect(await names("ana lop")).toEqual(["Ana"]);
    expect(await names("ben@ex")).toEqual(["Ben"]);
    expect(await names("305-219")).toEqual(["Ana"]);
    expect(await names("park ave")).toEqual(["Ben"]);
    expect(await names("CST-1001")).toEqual(["Ana"]);
    expect(await names("1002")).toEqual(["Ben"]);
    expect(await names("nobody")).toEqual([]);
  });
  it("returns counts and the latest deal", async () => {
    await deal(ana, "99 Second St");
    const [r] = (await clients.searchClients("ana@")) as any[];
    expect(r.deals).toBe(2);
    expect(r.latest_address).toBe("99 Second St");
    expect(r.latest_stage).toBe("new_request");
    expect(r.files).toBe(0);
  });
});

describe("client folder", () => {
  it("uploads, lists, serves and deletes a file, tied only to the client's own deal", async () => {
    const pdf = new File(["%PDF-1.4 test"], "Tax return 2024.pdf");
    const ok = await actions.uploadClientFile(null, form({ clientId: ana, dealId: benDeal, file: pdf }));
    expect(ok.ok).toBe(true);
    let folder = (await clients.loadClientFolder(ana))!;
    expect(folder.deals).toHaveLength(1);
    expect(folder.uploads).toHaveLength(1);
    expect(folder.uploads[0].deal_id).toBeNull(); // Ben's deal is ignored
    const id = folder.uploads[0].id;

    const res = await fileRoute.GET(new Request("http://x"), { params: Promise.resolve({ id }) });
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('inline; filename="Tax return 2024.pdf"');
    expect(res.headers.get("content-security-policy")).toBe("sandbox");
    expect(await res.text()).toBe("%PDF-1.4 test");

    await actions.uploadClientFile(null, form({ clientId: ana, dealId: anaDeal, file: new File(["a,b"], "rent roll.csv") }));
    folder = (await clients.loadClientFolder(ana))!;
    const csv = folder.uploads.find((u: any) => u.filename === "rent roll.csv")!;
    expect(csv.deal_number).toBe(1001);
    const csvRes = await fileRoute.GET(new Request("http://x"), { params: Promise.resolve({ id: csv.id }) });
    expect(csvRes.headers.get("content-disposition")).toMatch(/^attachment/);

    await actions.deleteClientFile(form({ fileId: id }));
    expect((await clients.loadClientFolder(ana))!.uploads).toHaveLength(1);
    expect((await clients.loadClientFolder(ben))!.uploads).toHaveLength(0);
  });

  it("rejects bad uploads", async () => {
    const up = (file: File) => actions.uploadClientFile(null, form({ clientId: ana, file }));
    expect((await up(new File(["x"], "virus.exe"))).ok).toBe(false);
    expect((await up(new File(["<html>"], "fake.pdf"))).message).toMatch(/valid PDF/);
    expect((await up(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png"))).message).toMatch(/4 MB/);
    expect((await up(new File([], "empty.txt"))).ok).toBe(false);
    expect((await clients.loadClientFolder(ana))!.uploads).toHaveLength(0);
  });

  it("saves notes and shows the client's website messages", async () => {
    await actions.saveClientNotes(form({ clientId: ana, notes: "Prefers email. CPA is Dana." }));
    await sql`insert into contact_messages (full_name, email, topic, message) values ('Ana Lopez', 'ANA@example.com', 'general', 'Question about bonus depreciation')`;
    const folder = (await clients.loadClientFolder(ana))!;
    expect(folder.client.notes).toBe("Prefers email. CPA is Dana.");
    expect(folder.messages).toHaveLength(1);
    expect(await clients.loadClientFolder(randomUUID())).toBeNull();
  });
});
