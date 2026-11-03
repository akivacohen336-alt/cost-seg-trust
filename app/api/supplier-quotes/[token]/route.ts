import { after, NextResponse } from "next/server";
import { standardizeQuote } from "@/lib/ai";
import { type QuoteValues } from "@/lib/quote-fields";
import { MAX_PDF, quoteSchema } from "@/lib/quote-schema";
import { declineSupplierQuote, submitSupplierQuote } from "@/lib/suppliers";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "The upload didn't go through. If you attached a PDF, make sure it's under 4 MB." }, { status: 400 });
  }

  if (form.get("action") === "decline") {
    const reason = String(form.get("reason") ?? "").trim().slice(0, 500) || null;
    const ok = await declineSupplierQuote(token, reason);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "This link has already been used or is no longer valid." }, { status: 409 });
  }

  const raw = Object.fromEntries(Object.keys(quoteSchema.shape).map(k => [k, form.get(k) ?? ""]));
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= "Please check this value";
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  let pdf: { filename: string; bytes: Buffer } | null = null;
  const file = form.get("proposal");
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > MAX_PDF) return NextResponse.json({ ok: false, error: "The PDF is over 4 MB. Please attach a smaller file." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ ok: false, error: "The attachment must be a PDF." }, { status: 415 });
    pdf = { filename: (file.name || "proposal.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 120), bytes };
  }

  const values = parsed.data as QuoteValues;
  if (values.fee == null && !pdf) {
    return NextResponse.json({ ok: false, error: "Please enter your fee or attach your proposal PDF.", fieldErrors: { fee: "Enter your fee, or attach your proposal" } }, { status: 422 });
  }

  const comments = String(form.get("comments") ?? "").trim().slice(0, 3000) || null;
  const saved = await submitSupplierQuote(token, values, comments, pdf);
  if (!saved) return NextResponse.json({ ok: false, error: "This link has already been used or is no longer valid." }, { status: 409 });

  // Read the proposal with AI after answering, so the supplier isn't kept waiting.
  if (pdf) after(() => standardizeQuote(saved.quoteId).then(() => undefined));
  return NextResponse.json({ ok: true });
}
