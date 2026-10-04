import postgres from "postgres";
import { config } from "./config";

// One pooled client per server instance. `prepare: false` keeps it compatible
// with Supabase's transaction pooler (port 6543), which serverless hosts use.
const globalForDb = globalThis as unknown as { __cstSql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.__cstSql) {
    globalForDb.__cstSql = postgres(config.databaseUrl, {
      max: 5,
      prepare: false,
      idle_timeout: 20,
      onnotice: () => {},
    });
  }
  return globalForDb.__cstSql;
}

export async function logEvent(dealId: string, kind: string, detail: Record<string, unknown> = {}) {
  await db()`insert into deal_events (deal_id, kind, detail) values (${dealId}, ${kind}, ${db().json(detail as postgres.JSONValue)})`;
}
