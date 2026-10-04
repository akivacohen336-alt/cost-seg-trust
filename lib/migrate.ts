// Sets up and upgrades the database automatically when the app starts,
// so no SQL has to be run by hand. Safe with several servers starting at
// once: one transaction-level lock, and each migration is applied only once.
import { db } from "./db";
import { config } from "./config";
import { MIGRATIONS } from "./migrations.generated";

let done: Promise<string[]> | null = null;

export function ensureSchema(): Promise<string[]> {
  if (!config.databaseUrl) return Promise.resolve([]);
  done ??= db().begin(async tx => {
    await tx`select pg_advisory_xact_lock(727274)`;
    await tx`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    await tx`alter table schema_migrations enable row level security`;
    const applied = new Set((await tx`select name from schema_migrations`).map(r => r.name as string));
    const ran: string[] = [];
    for (const m of MIGRATIONS) {
      if (applied.has(m.name)) continue;
      await tx.unsafe(m.sql);
      await tx`insert into schema_migrations (name) values (${m.name})`;
      ran.push(m.name);
    }
    return ran;
  }).catch(e => { done = null; throw e; });
  return done;
}
