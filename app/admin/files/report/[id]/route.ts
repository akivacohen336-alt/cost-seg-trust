import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Middleware checks the cookie; requireAdmin also turns away removed logins.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [r] = await db()`select pdf, filename from pdf_reports where id = ${id}`;
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(r.pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${r.filename}"` },
  });
}
