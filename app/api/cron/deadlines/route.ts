import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { runDeadlines } from "@/lib/suppliers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Called hourly by the scheduler (Vercel Cron sends "Authorization: Bearer <CRON_SECRET>").
export async function GET(req: Request) {
  if (!config.cronSecret || req.headers.get("authorization") !== `Bearer ${config.cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runDeadlines();
  return NextResponse.json({ ok: true, ...result });
}
