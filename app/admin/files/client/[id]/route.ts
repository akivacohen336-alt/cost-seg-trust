import { db } from "@/lib/db";
import { FILE_TYPES } from "@/lib/clients";

export const runtime = "nodejs";

// Protected by middleware: only the signed-in admin reaches /admin/*.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [f] = await db()`select filename, content_type, data from client_files where id = ${id}`;
  if (!f) return new Response("Not found", { status: 404 });
  const inline = FILE_TYPES[f.content_type]?.inline ?? false;
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": FILE_TYPES[f.content_type] ? f.content_type : "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${f.filename}"`,
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
