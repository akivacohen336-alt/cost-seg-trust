// Dashboard logins besides the owner's. Each person gets an emailed link to
// choose their own password; the link works once and for 7 days.
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { config } from "./config";
import { db } from "./db";
import { emailHtml, esc, sendEmail } from "./notify";

const LINK_DAYS = 7;
import { MIN_PASSWORD } from "./team-rules";
export { MIN_PASSWORD };

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const isOwner = (email: string) => email.toLowerCase() === config.admin.email.toLowerCase();

export type TeamMember = {
  id: string; email: string; name: string | null; active: boolean; invited_by: string | null;
  created_at: Date; password_set_at: Date | null; last_login_at: Date | null; invite_expires_at: Date | null;
};

export async function listTeam(): Promise<TeamMember[]> {
  return (await db()`select id, email, name, active, invited_by, created_at, password_set_at, last_login_at, invite_expires_at
                     from admin_users order by created_at`) as unknown as TeamMember[];
}

/** Makes (or refreshes) a set-password link for this person and emails it. */
export async function sendPasswordLink(email: string, opts: { name?: string | null; invitedBy?: string; reset?: boolean } = {}) {
  email = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (isOwner(email)) throw new Error("That is the owner login, which already has a password.");
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + LINK_DAYS * 864e5);
  const [m] = await db()`
    insert into admin_users (email, name, invite_token_hash, invite_expires_at, invited_by)
    values (${email}, ${opts.name?.trim() || null}, ${hashToken(token)}, ${expires}, ${opts.invitedBy ?? null})
    on conflict (email) do update set
      name = coalesce(excluded.name, admin_users.name),
      invite_token_hash = excluded.invite_token_hash, invite_expires_at = excluded.invite_expires_at, active = true
    returning id, name, password_hash is not null as has_password`;
  const link = `${config.appUrl}/admin/set-password?token=${token}`;
  const reset = opts.reset || m.has_password;
  const hi = m.name ? `Hi ${esc(m.name)},` : "Hi,";
  const body = reset
    ? `${hi}<br><br>Here is a link to choose a new password for the ${config.brand} dashboard. It works once, for ${LINK_DAYS} days.`
    : `${hi}<br><br>You now have your own login to the ${config.brand} dashboard. Click below to choose your password. The link works once, for ${LINK_DAYS} days.<br><br>After that, sign in at <a href="${esc(config.appUrl)}/admin">${esc(config.appUrl.replace(/^https?:\/\//, ""))}/admin</a> with this email (${esc(email)}) and your password.`;
  const sent = await sendEmail({
    to: email, purpose: reset ? "admin_password_reset" : "admin_invite",
    subject: reset ? `Reset your ${config.brand} password` : `Your ${config.brand} dashboard login`,
    html: emailHtml(reset ? "Choose a new password" : "Your dashboard login", body, { href: link, label: reset ? "Choose a new password" : "Set my password" }),
    text: `${reset ? "Choose a new password" : "Set your password"} for the ${config.brand} dashboard (works once, for ${LINK_DAYS} days):\n${link}`,
  });
  return { link, email: sent };
}

export async function setPasswordWithToken(token: string, password: string): Promise<{ email?: string; error?: string }> {
  if (password.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  const hash = await bcrypt.hash(password, 12);
  const [m] = await db()`
    update admin_users set password_hash = ${hash}, password_set_at = now(), invite_token_hash = null, invite_expires_at = null
    where invite_token_hash = ${hashToken(token)} and invite_expires_at > now() and active
    returning email`;
  return m ? { email: m.email } : { error: "This link has expired or was already used. Ask for a new one from the sign-in page." };
}

export async function linkIsValid(token: string) {
  const [m] = await db()`select email from admin_users where invite_token_hash = ${hashToken(token)} and invite_expires_at > now() and active`;
  return m ? (m.email as string) : null;
}

/** True when the email and password belong to an active team member. */
export async function checkTeamLogin(email: string, password: string) {
  const [m] = await db()`select id, password_hash from admin_users where email = ${email.toLowerCase()} and active and password_hash is not null`;
  if (!m || !(await bcrypt.compare(password, m.password_hash))) return false;
  await db()`update admin_users set last_login_at = now() where id = ${m.id}`;
  return true;
}

export async function isActiveTeamMember(email: string) {
  const [m] = await db()`select 1 from admin_users where email = ${email.toLowerCase()} and active and password_hash is not null`;
  return !!m;
}

/** Turns a login off; their next click in the dashboard signs them out. */
export async function removeTeamMember(id: string) {
  await db()`update admin_users set active = false, password_hash = null, invite_token_hash = null, invite_expires_at = null where id = ${id}`;
}
