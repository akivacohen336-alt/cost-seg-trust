// Applies db/migrations/*.sql in order (tracked in schema_migrations), then
// db/seed/*.sql when run with --seed. Usage: DATABASE_URL=... node scripts/migrate.mjs [--seed]
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const sql = postgres(url, { max: 1, onnotice: () => {} });
const root = path.dirname(new URL(import.meta.url).pathname);

try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table schema_migrations enable row level security`;
  const dir = path.join(root, "..", "db", "migrations");
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort()) {
    const [done] = await sql`select 1 from schema_migrations where name = ${file}`;
    if (done) continue;
    await sql.begin(async tx => {
      await tx.unsafe(fs.readFileSync(path.join(dir, file), "utf8"));
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log("applied", file);
  }
  if (process.argv.includes("--seed")) {
    const seedDir = path.join(root, "..", "db", "seed");
    for (const file of fs.readdirSync(seedDir).filter(f => f.endsWith(".sql")).sort()) {
      await sql.unsafe(fs.readFileSync(path.join(seedDir, file), "utf8"));
      console.log("seeded", file);
    }
  }
} finally {
  await sql.end();
}
