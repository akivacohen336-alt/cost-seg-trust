import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { isActiveTeamMember } from "./team";

/** Who is signed in: the owner, or a team member whose login is still on. */
export async function currentAdmin() {
  const jar = await cookies();
  const s = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  if (s.email === config.admin.email.toLowerCase()) return { email: s.email, owner: true };
  return (await isActiveTeamMember(s.email)) ? { email: s.email, owner: false } : null;
}

/** Server actions and file downloads call this first: middleware only checks the cookie's signature. */
export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

/** Only the owner can add or remove logins. */
export async function requireOwner() {
  const a = await requireAdmin();
  if (!a.owner) redirect("/admin/settings");
  return a;
}
