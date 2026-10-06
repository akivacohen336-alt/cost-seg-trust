"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { config } from "@/lib/config";
import { db, logEvent } from "@/lib/db";
import { setDealStage, syncDealToHubSpot } from "@/lib/deals";
import { setupHubSpot } from "@/lib/hubspot";
import { sendEmail } from "@/lib/notify";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { requireAdmin } from "@/lib/admin-auth";
import { isStageKey } from "@/lib/stages";


export async function login(_: unknown, form: FormData): Promise<{ error?: string; email?: string }> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!config.admin.passwordHash || !config.admin.sessionSecret) {
    return { email, error: "Admin login isn't set up yet. Add ADMIN_PASSWORD_HASH and SESSION_SECRET to the server settings." };
  }
  const ok = email === config.admin.email.toLowerCase() && (await bcrypt.compare(password, config.admin.passwordHash));
  if (!ok) {
    await new Promise(r => setTimeout(r, 800)); // slow down guessing
    return { email, error: "That email and password don't match." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(email), sessionCookieOptions);
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function changeStage(form: FormData) {
  await requireAdmin();
  const id = String(form.get("dealId"));
  const stage = String(form.get("stage"));
  const outcome = String(form.get("outcome") ?? "");
  if (!isStageKey(stage)) return;
  await setDealStage(id, stage, outcome === "won" || outcome === "lost" ? outcome : null);
  revalidatePath(`/admin/deals/${id}`);
}

export async function saveNotes(form: FormData) {
  await requireAdmin();
  const id = String(form.get("dealId"));
  await db()`update deals set admin_notes = ${String(form.get("notes") ?? "").slice(0, 5000)} where id = ${id}`;
  await logEvent(id, "notes_updated");
  revalidatePath(`/admin/deals/${id}`);
}

export async function retryHubSpot(form: FormData) {
  await requireAdmin();
  const id = String(form.get("dealId"));
  await syncDealToHubSpot(id);
  revalidatePath(`/admin/deals/${id}`);
}

export async function addSupplier(form: FormData) {
  await requireAdmin();
  const name = String(form.get("companyName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return;
  await db()`insert into suppliers (company_name, contact_name, email, phone, description, is_test)
             values (${name}, ${String(form.get("contactName") ?? "").trim() || null}, ${email},
                     ${String(form.get("phone") ?? "").trim() || null}, ${String(form.get("description") ?? "").trim() || null},
                     ${form.get("isTest") === "on"})
             on conflict (email) do nothing`;
  revalidatePath("/admin/suppliers");
}

export async function toggleSupplier(form: FormData) {
  await requireAdmin();
  await db()`update suppliers set active = not active where id = ${String(form.get("id"))}`;
  revalidatePath("/admin/suppliers");
}

export async function runHubSpotSetup(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const r = await setupHubSpot();
    return { ok: true, message: `HubSpot is ready. Request-ID property ${r.property}; pipeline has ${Object.keys(r.pipeline.stages).length} stages.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function sendTestAlert(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const email = await sendEmail({
    to: config.owner.emails, subject: "Cost Seg Trust test alert", purpose: "test",
    text: "This is a test alert from your Cost Seg Trust admin.", html: "<p>This is a test alert from your Cost Seg Trust admin.</p>",
  });
  return { ok: email.status === "sent", message: `Email ${email.status === "sent" ? `sent to ${config.owner.emails.join(" and ")}` : `${email.status}${email.error ? ` (${email.error})` : ""}`}.` };
}
