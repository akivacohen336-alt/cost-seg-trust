"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

// Saves a supplier's details. Editing never emails anyone, and the Test/Real
// flag is not editable here, so the test-deal block cannot be bypassed.
export async function updateSupplierAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const id = form.get("id");
  if (!isId(id)) return { error: "Unknown supplier." };
  const name = text(form, "companyName");
  const email = text(form, "email").toLowerCase();
  if (!name) return { error: "Enter the company name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid quote email." };
  const [taken] = await db()`select 1 from suppliers where email = ${email} and id <> ${id}`;
  if (taken) return { error: "Another supplier already uses that email." };
  const rows = await db()`update suppliers set
      company_name = ${name},
      contact_name = ${text(form, "contactName") || null},
      email = ${email},
      phone = ${text(form, "phone") || null},
      description = ${text(form, "description") || null}
    where id = ${id} returning id`;
  if (rows.length === 0) return { error: "Unknown supplier." };
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}
