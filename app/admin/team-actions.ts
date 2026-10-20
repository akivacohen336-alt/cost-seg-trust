"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { removeTeamMember, sendPasswordLink, setPasswordWithToken } from "@/lib/team";

type LinkResult = { ok?: boolean; message?: string; link?: string };

/** Owner adds a login (or sends a fresh link); the person picks their own password. */
export async function inviteTeamMember(_: unknown, form: FormData): Promise<LinkResult> {
  const me = await requireOwner();
  try {
    const r = await sendPasswordLink(String(form.get("email") ?? ""), { name: String(form.get("name") ?? ""), invitedBy: me.email });
    revalidatePath("/admin/settings");
    return r.email.status === "sent"
      ? { ok: true, message: `Emailed a set-password link to ${String(form.get("email")).trim()}.`, link: r.link }
      : { ok: false, message: `The email didn't go out (${r.email.error ?? r.email.status}). Send them this link yourself:`, link: r.link };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function removeTeamLogin(form: FormData) {
  await requireOwner();
  await removeTeamMember(String(form.get("id")));
  revalidatePath("/admin/settings");
}

export async function choosePassword(_: unknown, form: FormData): Promise<{ error?: string }> {
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const r = await setPasswordWithToken(String(form.get("token") ?? ""), password);
  if (!r.email) return { error: r.error };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(r.email), sessionCookieOptions);
  redirect("/admin");
}

/** Always answers the same way, so it can't be used to learn who has a login. */
export async function forgotPassword(_: unknown, form: FormData): Promise<{ done?: boolean }> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const [m] = await db()`select 1 from admin_users where email = ${email} and active and password_hash is not null
                         and (invite_expires_at is null or invite_expires_at < now() + interval '7 days' - interval '2 minutes')`;
  if (m) await sendPasswordLink(email, { reset: true }).catch(e => console.error("forgotPassword", e));
  return { done: true };
}
