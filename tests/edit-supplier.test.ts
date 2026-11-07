// Editing a supplier on the dashboard: real Postgres, no email ever sent.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: async () => ({ email: "akivacohen336@gmail.com", owner: true }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw Object.assign(new Error("REDIRECT"), { to }); } }));

let sql: any;
let actions: typeof import("../app/admin/supplier-actions");
const fetchSpy = vi.fn(async () => new Response("{}"));

beforeAll(async () => {
  vi.stubGlobal("fetch", fetchSpy);
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  actions = await import("../app/admin/supplier-actions");
});
afterAll(async () => { await sql`delete from suppliers where email::text like '%@edit-test.example'`; await sql.end(); });

const form = (fields: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); return f; };
async function save(fields: Record<string, string>) {
  try { return await actions.updateSupplierAction(null, form(fields)); } catch (e: any) { if (e.message === "REDIRECT") return { to: e.to as string }; throw e; }
}
let a: string;

beforeEach(async () => {
  await sql`delete from suppliers where email::text like '%@edit-test.example'`;
  fetchSpy.mockClear();
  [{ id: a }] = await sql`insert into suppliers (company_name, email, is_test) values
    ('Edit Co', 'edit@edit-test.example', true), ('Other Co', 'other@edit-test.example', false) returning id`;
});

describe("Edit supplier", () => {
  it("saves the new details, keeps Test/Real, and emails nobody", async () => {
    const before = (await sql`select count(*)::int n from notifications`)[0].n;
    const r: any = await save({ id: a, companyName: "Edit Co Renamed", contactName: "Pat", email: "New@Edit-Test.example", phone: "305", description: "desk", isTest: "" });
    expect(r.to).toBe("/admin/suppliers");
    const [s] = await sql`select company_name, contact_name, email::text as email, phone, description, is_test from suppliers where id = ${a}`;
    expect(s).toEqual({ company_name: "Edit Co Renamed", contact_name: "Pat", email: "new@edit-test.example", phone: "305", description: "desk", is_test: true });
    expect((await sql`select count(*)::int n from notifications`)[0].n).toBe(before);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("clears optional fields", async () => {
    await sql`update suppliers set contact_name = 'X', phone = '1' where id = ${a}`;
    await save({ id: a, companyName: "Edit Co", contactName: "", email: "edit@edit-test.example", phone: "", description: "" });
    const [s] = await sql`select contact_name, phone from suppliers where id = ${a}`;
    expect(s).toEqual({ contact_name: null, phone: null });
  });
  it("says what is wrong and changes nothing", async () => {
    expect(await save({ id: a, companyName: "", email: "edit@edit-test.example" })).toEqual({ error: "Enter the company name." });
    expect(await save({ id: a, companyName: "X", email: "nope" })).toEqual({ error: "Enter a valid quote email." });
    expect(await save({ id: a, companyName: "X", email: "other@edit-test.example" })).toEqual({ error: "Another supplier already uses that email." });
    expect(await save({ id: "not-an-id", companyName: "X", email: "x@edit-test.example" })).toEqual({ error: "Unknown supplier." });
    const [s] = await sql`select company_name from suppliers where id = ${a}`;
    expect(s.company_name).toBe("Edit Co");
  });
});
