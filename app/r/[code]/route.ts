import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/migrate";
import { REF_COOKIE, REF_COOKIE_DAYS, findActivePartnerByCode } from "@/lib/partners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A partner's referral link. Remembers the partner for a year, so a client
// who looks around first and requests quotes later is still credited.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const partner = await ensureSchema().then(() => findActivePartnerByCode(code)).catch(e => {
    console.error("referral link lookup failed", e);
    return null;
  });
  const url = new URL(partner ? `/quote?ref=${partner.code}` : "/quote", req.url);
  const res = NextResponse.redirect(url, 307);
  if (partner) {
    res.cookies.set(REF_COOKIE, partner.code, {
      maxAge: REF_COOKIE_DAYS * 86400, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
