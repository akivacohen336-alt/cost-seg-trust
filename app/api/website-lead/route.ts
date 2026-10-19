import { NextResponse } from "next/server";
import { afterDealCreated, createDealFromRequest } from "@/lib/deals";
import { ensureSchema } from "@/lib/migrate";
import { normalizeCode } from "@/lib/partners";
import { allowedOrigin, parseWebsiteLead } from "@/lib/website-lead";

export const runtime = "nodejs";

// The main website (costsegtrust.com) posts a copy of every quote form here
// from the visitor's browser, alongside the email it already sends.
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
  // Browsers always send Origin on a cross-site post; anything else is refused.
  if (!allowedOrigin(origin)) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403, headers });

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
    const lead = { ...parsed.lead, ref: normalizeCode(parsed.lead.ref ?? "") || undefined };
    const result = await createDealFromRequest(lead);
    if (!result.duplicate) await afterDealCreated(result.dealId);
    return NextResponse.json({ ok: true, reference: `CST-${result.number}` }, { headers });
  } catch (e) {
    console.error("website lead failed", e);
    return NextResponse.json({ ok: false, error: "Could not save the lead" }, { status: 500, headers });
  }
}
