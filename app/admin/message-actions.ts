"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function toggleMessageHandled(form: FormData) {
  await requireAdmin();
  await db()`update contact_messages set handled = not handled where id = ${Number(form.get("id"))}`;
  revalidatePath("/admin/messages");
}
