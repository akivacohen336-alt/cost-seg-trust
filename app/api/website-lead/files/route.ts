import { NextResponse } from "next/server";
import { dealForToken, saveLeadFile } from "@/lib/lead-files";

export const runtime = "nodejs";

// One document per request from the website quote form (see lib/lead-files.ts).
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const dealId = await dealForToken(String(form.get("token") ?? ""));
  if (!dealId) return NextResponse.json({ ok: false, error: "This upload link has expired" }, { status: 401 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  try {
    const r = await saveLeadFile(dealId, String(form.get("docType") ?? ""), file);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: r.error }, { status: r.status });
  } catch (e) {
    console.error("lead file upload failed", e);
    return NextResponse.json({ ok: false, error: "Could not save the file" }, { status: 500 });
  }
}
