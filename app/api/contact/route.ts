import { NextResponse } from "next/server";
import { contactSchema, saveContactMessage } from "@/lib/contact";
import { ensureSchema } from "@/lib/migrate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      if (k === "website") return NextResponse.json({ ok: true }); // honeypot: pretend success
      fieldErrors[k] ??= issue.message;
    }
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields", fieldErrors }, { status: 422 });
  }
  try {
    await ensureSchema();
    await saveContactMessage(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact message failed", e);
    return NextResponse.json({ ok: false, error: "Something went wrong sending your message. Please email or call us instead." }, { status: 500 });
  }
}
