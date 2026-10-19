import { NextResponse } from "next/server";
import { afterDealCreated, createDealFromRequest } from "@/lib/deals";
import { ensureSchema } from "@/lib/migrate";
import { leadFilesToken } from "@/lib/lead-files";
import { REF_COOKIE, normalizeCode } from "@/lib/partners";
import { allowedOrigin, parseWebsiteLead } from "@/lib/website-lead";

export const runtime = "nodejs";

// The quote form posts here: our own site's form (same origin), and the
// Lovable site (costsegtrust.com) while it is still live, which sends a copy
// from the visitor's browser alongside the email it already sends.
function cors(req: Request) {
  const origin = req.headers.get("origin");
  return {
    ...(allowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin! } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const headers = cors(req);
  const origin = req.headers.get("origin");
  // Browsers always send Origin on a post; anything else is refused.
  const sameSite = !!origin && origin === new URL(req.url).origin;
  if (!sameSite && !allowedOrigin(origin)) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403, headers });

  let body: Record<string, unknown>;
  try {
    const type = req.headers.get("content-type") ?? "";
    body = type.includes("json") || !type
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers });
  }

  const parsed = parseWebsiteLead(body);
  if (!parsed.ok) {
    if (parsed.error === "spam") return NextResponse.json({ ok: true }, { headers });
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 422, headers });
  }

  try {
    await ensureSchema();
    // A partner code in the form wins; on our own site, otherwise the cookie from a partner's /r/ link.
    const ref = normalizeCode(parsed.lead.ref ?? (sameSite ? cookieValue(req, REF_COOKIE) : undefined) ?? "") || undefined;
    const result = await createDealFromRequest({ ...parsed.lead, ref });
    if (!result.duplicate) await afterDealCreated(result.dealId);
    // Our own form then uploads any documents the client attached.
    const uploadToken = sameSite ? await leadFilesToken(result.dealId).catch(() => undefined) : undefined;
    return NextResponse.json({ ok: true, reference: `CST-${result.number}`, uploadToken }, { headers });
  } catch (e) {
    console.error("website lead failed", e);
    return NextResponse.json({ ok: false, error: "Could not save the lead" }, { status: 500, headers });
  }
}

function cookieValue(req: Request, name: string) {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}
