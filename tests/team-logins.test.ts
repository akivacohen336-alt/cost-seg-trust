// Extra dashboard logins: real Postgres, fake email, cookies kept in memory.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { createFakeServices } from "./fake-services";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined),
  set: (k: string, v: string) => { jar.set(k, v); }, delete: (k: string) => { jar.delete(k); },
}) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { url }); } }));

const fake = createFakeServices();
let sql: any;
let team: typeof import("../app/admin/team-actions");
let actions: typeof import("../app/admin/actions");
let auth: typeof import("../lib/admin-auth");
let session: typeof import("../lib/session");

const OWNER = "owner@costsegtrust.test";
const form = (f: Record<string, string>) => { const d = new FormData(); for (const [k, v] of Object.entries(f)) d.append(k, v); return d; };
const redirectOf = (p: Promise<unknown>) => p.then(() => null, e => e.url ?? Promise.reject(e));
const signInAs = async (email: string) => jar.set(session.SESSION_COOKIE, await session.createSessionToken(email));
const tokenFromLastEmail = () => new URL(fake.state.emails.at(-1).text.match(/https?:\S+/)[0]).searchParams.get("token")!;

beforeAll(async () => {
  const base = await fake.listen();
  Object.assign(process.env, {
    RESEND_API_KEY: "test-resend", RESEND_API_URL: base, APP_URL: "https://costsegtrust.test",
    SESSION_SECRET: process.env.SESSION_SECRET ?? "x".repeat(40),
    ADMIN_EMAIL: OWNER, ADMIN_PASSWORD_HASH: await bcrypt.hash("owner-password", 4),
  });
  await (await import("../lib/migrate")).ensureSchema();
  sql = (await import("../lib/db")).db();
  team = await import("../app/admin/team-actions");
  actions = await import("../app/admin/actions");
  auth = await import("../lib/admin-auth");
  session = await import("../lib/session");
});
afterAll(async () => { await fake.close(); await sql.end(); });
beforeEach(async () => { fake.reset(); jar.clear(); await sql`truncate admin_users`; });

describe("team logins", () => {
  it("owner invites the CEO, who sets his own password and signs in", async () => {
    await signInAs(OWNER);
    const r = await team.inviteTeamMember(null, form({ name: "Tzachi", email: " Aron.Turen@Gmail.com " }));
    expect(r.ok).toBe(true);
    const mail = fake.state.emails.at(-1);
    expect(mail.to).toEqual(["aron.turen@gmail.com"]);
    expect(mail.html).toContain("Set my password");
    expect(mail.text).toContain("https://costsegtrust.test/admin/set-password?token=");
    const [row] = await sql`select * from admin_users`;
    expect(row.password_hash).toBeNull();
    expect(row.invite_token_hash).not.toContain(tokenFromLastEmail()); // only a hash is stored

    jar.clear();
    const token = tokenFromLastEmail();
    expect(await team.choosePassword(null, form({ token, password: "short", confirm: "short" }))).toEqual({ error: "Use at least 10 characters." });
    expect(await team.choosePassword(null, form({ token, password: "ceo-password-1", confirm: "different-123" }))).toEqual({ error: "The two passwords don't match." });
    expect(await redirectOf(team.choosePassword(null, form({ token, password: "ceo-password-1", confirm: "ceo-password-1" })))).toBe("/admin");
    expect(await auth.currentAdmin()).toEqual({ email: "aron.turen@gmail.com", owner: false });

    // the link works only once
    expect((await team.choosePassword(null, form({ token, password: "another-pass-2", confirm: "another-pass-2" }))).error).toMatch(/expired or was already used/);

    jar.clear();
    expect((await actions.login(null, form({ email: "aron.turen@gmail.com", password: "wrong-password" }))).error).toMatch(/don't match/);
    expect(await redirectOf(actions.login(null, form({ email: "Aron.Turen@gmail.com", password: "ceo-password-1" })))).toBe("/admin");
    expect((await sql`select last_login_at from admin_users`)[0].last_login_at).not.toBeNull();
  });

  it("owner can still sign in with the original password", async () => {
    expect(await redirectOf(actions.login(null, form({ email: OWNER, password: "owner-password" })))).toBe("/admin");
    expect(await auth.currentAdmin()).toEqual({ email: OWNER, owner: true });
  });

  it("only the owner can add logins, and a removed login is signed out", async () => {
    await signInAs(OWNER);
    await team.inviteTeamMember(null, form({ email: "ceo@example.com" }));
    jar.clear();
    await redirectOf(team.choosePassword(null, form({ token: tokenFromLastEmail(), password: "ceo-password-1", confirm: "ceo-password-1" })));
    expect(await redirectOf(team.inviteTeamMember(null, form({ email: "someone@example.com" })))).toBe("/admin/settings");
    expect((await sql`select count(*)::int as n from admin_users`)[0].n).toBe(1);

    const ceoCookie = jar.get(session.SESSION_COOKIE)!;
    await signInAs(OWNER);
    const [row] = await sql`select id from admin_users`;
    await team.removeTeamLogin(form({ id: row.id }));
    jar.set(session.SESSION_COOKIE, ceoCookie);
    expect(await auth.currentAdmin()).toBeNull();
    expect(await redirectOf(auth.requireAdmin())).toBe("/admin/login");
    jar.clear();
    expect((await actions.login(null, form({ email: "ceo@example.com", password: "ceo-password-1" }))).error).toMatch(/don't match/);
  });

  it("forgot password emails a fresh link only to real logins, and expired links fail", async () => {
    await signInAs(OWNER);
    await team.inviteTeamMember(null, form({ email: "ceo@example.com" }));
    const firstToken = tokenFromLastEmail();
    jar.clear();
    await redirectOf(team.choosePassword(null, form({ token: firstToken, password: "ceo-password-1", confirm: "ceo-password-1" })));
    jar.clear();
    fake.reset();

    expect(await team.forgotPassword(null, form({ email: "nobody@example.com" }))).toEqual({ done: true });
    expect(fake.state.emails).toHaveLength(0);
    expect(await team.forgotPassword(null, form({ email: "ceo@example.com" }))).toEqual({ done: true });
    expect(fake.state.emails).toHaveLength(1);
    expect(fake.state.emails[0].subject).toMatch(/Reset/);
    await team.forgotPassword(null, form({ email: "ceo@example.com" })); // a second click right away sends nothing more
    expect(fake.state.emails).toHaveLength(1);

    const token = tokenFromLastEmail();
    await sql`update admin_users set invite_expires_at = now() - interval '1 minute'`;
    expect((await team.choosePassword(null, form({ token, password: "new-password-9", confirm: "new-password-9" }))).error).toMatch(/expired/);
    expect(await redirectOf(actions.login(null, form({ email: "ceo@example.com", password: "ceo-password-1" })))).toBe("/admin");
  });

  it("a forged cookie for an unknown email is not let in", async () => {
    await signInAs("stranger@example.com");
    expect(await auth.currentAdmin()).toBeNull();
  });
});
