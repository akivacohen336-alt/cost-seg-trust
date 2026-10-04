import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quick check that the site can reach its database. Also sets up the tables
// if startup could not (for example, the database was briefly unreachable).
export async function GET() {
  try {
    await ensureSchema();
    await db()`select 1`;
    return NextResponse.json({ ok: true, database: "ok" });
  } catch (e) {
    return NextResponse.json({ ok: false, database: (e as Error).message }, { status: 503 });
  }
}
