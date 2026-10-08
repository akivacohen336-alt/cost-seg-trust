import { NextResponse } from "next/server";
import { afterDealCreated, createDealFromRequest } from "@/lib/deals";
import { ensureSchema } from "@/lib/migrate";
import { REF_COOKIE, normalizeCode } from "@/lib/partners";
import { quoteRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const parsed = quoteRequestSchema.safeParse(body);
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
    // A partner code in the form wins; otherwise the cookie set by a partner's /r/ link.
    const ref = normalizeCode(parsed.data.ref ?? cookieValue(req, REF_COOKIE) ?? "") || undefined;
    const result = await createDealFromRequest({ ...parsed.data, ref });
    // The owner alert and HubSpot sync run before we answer, so serverless
    // hosts don't stop them midway. Failures are recorded on the deal and
    // never shown to the client.
    if (!result.duplicate) await afterDealCreated(result.dealId);
    return NextResponse.json({ ok: true, reference: `CST-${result.number}` });
  } catch (e) {
    console.error("quote request failed", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong saving your request. Please try again or email us." },
      { status: 500 },
    );
  }
}

function cookieValue(req: Request, name: string) {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}
