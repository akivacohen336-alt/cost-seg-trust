import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Middleware checks the cookie; requireAdmin also turns away removed logins.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [q] = await db()`select proposal_pdf, proposal_filename from supplier_quotes where id = ${id}`;
  if (!q?.proposal_pdf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(q.proposal_pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${q.proposal_filename ?? "proposal.pdf"}"` },
  });
}
