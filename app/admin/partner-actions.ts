"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { isCode, normalizeCode, uniqueCode } from "@/lib/partners";

const text = (form: FormData, k: string, max = 200) => String(form.get(k) ?? "").trim().slice(0, max) || null;
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export async function addPartner(form: FormData) {
  await requireAdmin();
  const name = text(form, "name", 120);
  if (!name) return;
  const email = text(form, "email");
  const code = await uniqueCode(text(form, "code", 40) ?? name);
  const [p] = await db()`
    insert into partners (name, company, email, phone, code, commission, notes)
    values (${name}, ${text(form, "company", 120)}, ${email && /^\S+@\S+\.\S+$/.test(email) ? email.toLowerCase() : null},
            ${text(form, "phone", 40)}, ${code}, ${text(form, "commission")}, ${text(form, "notes", 2000)})
    returning id`;
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${p.id}`);
}

export async function updatePartner(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const name = text(form, "name", 120);
  if (!isUuid(id) || !name) return;
  const email = text(form, "email");
  // Changing the code retires the old referral link; a code taken by another partner is ignored.
  const wanted = normalizeCode(text(form, "code", 40) ?? "");
  const [clash] = isCode(wanted) ? await db()`select 1 from partners where code = ${wanted} and id <> ${id}` : [true];
  await db()`
    update partners set name = ${name}, company = ${text(form, "company", 120)},
      email = ${email && /^\S+@\S+\.\S+$/.test(email) ? email.toLowerCase() : null}, phone = ${text(form, "phone", 40)},
      commission = ${text(form, "commission")}, notes = ${text(form, "notes", 2000)},
      code = coalesce(${clash ? null : wanted}::text, code)
    where id = ${id}`;
  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
}

export async function togglePartner(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  if (!isUuid(id)) return;
  await db()`update partners set active = not active where id = ${id}`;
  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
}

/** Replaces the partner's portal link; the old one stops working. */
export async function replacePortalLink(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  if (!isUuid(id)) return;
  await db()`update partners set link_version = link_version + 1 where id = ${id}`;
  revalidatePath(`/admin/partners/${id}`);
}

/** Tags a deal to a partner by hand (e.g. the client phoned in), or clears it. */
export async function setDealPartner(form: FormData) {
  await requireAdmin();
  const dealId = String(form.get("dealId"));
  const partnerId = String(form.get("partnerId") ?? "");
  if (!isUuid(dealId) || (partnerId && !isUuid(partnerId))) return;
  const [d] = await db()`
    update deals set partner_id = ${partnerId || null} where id = ${dealId}
    returning (select name from partners where id = partner_id) as partner`;
  if (!d) return;
  await logEvent(dealId, "partner_set", { partner: d.partner ?? null });
  revalidatePath(`/admin/deals/${dealId}`);
  if (partnerId) revalidatePath(`/admin/partners/${partnerId}`);
}

export async function saveCommission(form: FormData) {
  await requireAdmin();
  const dealId = String(form.get("dealId"));
  if (!isUuid(dealId)) return;
  const raw = String(form.get("amount") ?? "").replace(/[$,\s]/g, "");
  const amount = raw === "" ? null : Number(raw);
  if (amount != null && !(Number.isFinite(amount) && amount >= 0 && amount < 1e10)) return;
  const [d] = await db()`
    update deals set partner_commission = ${amount}, partner_commission_paid = ${form.get("paid") === "on"}
    where id = ${dealId} returning partner_id`;
  if (d?.partner_id) revalidatePath(`/admin/partners/${d.partner_id}`);
  revalidatePath(`/admin/deals/${dealId}`);
}
