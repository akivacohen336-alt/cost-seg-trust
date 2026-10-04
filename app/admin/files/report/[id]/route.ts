import { db } from "@/lib/db";

export const runtime = "nodejs";

// Protected by middleware: only the signed-in admin reaches /admin/*.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [r] = await db()`select pdf, filename from pdf_reports where id = ${id}`;
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(r.pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${r.filename}"` },
  });
}
