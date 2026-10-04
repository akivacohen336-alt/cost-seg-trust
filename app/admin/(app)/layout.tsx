import { after } from "next/server";
import AdminHeader from "@/components/AdminHeader";
import { ensureSchema } from "@/lib/migrate";
import { runDeadlines } from "@/lib/suppliers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost Seg Trust · Admin", robots: { index: false } };

// Backup for the hourly scheduler: opening the dashboard also runs the
// 40-hour clock (at most every 10 minutes per server instance).
let lastRun = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Normally done at startup; retried here in case the database was unreachable then.
  await ensureSchema().catch(e => console.error("Database setup failed:", (e as Error).message));
  if (Date.now() - lastRun > 10 * 60_000) {
    lastRun = Date.now();
    after(() => runDeadlines().catch(e => console.error("runDeadlines", e)));
  }
  return (
    <>
      <AdminHeader />
      <main className="admin-main">{children}</main>
    </>
  );
}
