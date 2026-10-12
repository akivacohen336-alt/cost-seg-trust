"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { MAX_CLIENT_FILE, fileTypeFor, safeFilename } from "@/lib/clients";

const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export async function saveClientNotes(form: FormData) {
  await requireAdmin();
  const id = form.get("clientId");
  if (!isId(id)) return;
  await db()`update clients set notes = ${String(form.get("notes") ?? "").slice(0, 10000)} where id = ${id}`;
  revalidatePath(`/admin/clients/${id}`);
}

export async function uploadClientFile(_: unknown, form: FormData): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const clientId = form.get("clientId");
  const dealId = form.get("dealId");
  if (!isId(clientId)) return { ok: false, message: "Unknown client." };
  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, message: "Choose a file first." };
  if (file.size > MAX_CLIENT_FILE) return { ok: false, message: "That file is over 4 MB." };
  const type = fileTypeFor(file.name);
  if (!type) return { ok: false, message: "Upload a PDF, image, Word, Excel, CSV or text file." };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (type === "application/pdf" && bytes.subarray(0, 5).toString() !== "%PDF-") return { ok: false, message: "That file isn't a valid PDF." };
  const sql = db();
  const deal = isId(dealId) ? (await sql`select id from deals where id = ${dealId} and client_id = ${clientId}`)[0] : null;
  await sql`insert into client_files (client_id, deal_id, filename, content_type, size_bytes, data)
            values (${clientId}, ${deal?.id ?? null}, ${safeFilename(file.name)}, ${type}, ${bytes.length}, ${bytes})`;
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, message: `Added ${safeFilename(file.name)}.` };
}

export async function deleteClientFile(form: FormData) {
  await requireAdmin();
  const id = form.get("fileId");
  if (!isId(id)) return;
  const [f] = await db()`delete from client_files where id = ${id} returning client_id`;
  if (f) revalidatePath(`/admin/clients/${f.client_id}`);
}
