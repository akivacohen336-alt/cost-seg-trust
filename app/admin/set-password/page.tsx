import BrandMark from "@/components/BrandMark";
import ChoosePasswordForm from "@/components/ChoosePasswordForm";
import { ensureSchema } from "@/lib/migrate";
import { linkIsValid } from "@/lib/team";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost Seg Trust · Set your password", robots: { index: false } };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  await ensureSchema().catch(() => {});
  const email = token ? await linkIsValid(token) : null;
  return (
    <main className="login">
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div>
          <div className="brand brand-row"><BrandMark />Cost Seg <span>Trust</span></div>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Choose your password</p>
        </div>
        {email ? <ChoosePasswordForm token={token} email={email} /> : (
          <>
            <p className="notice bad" style={{ margin: 0 }}>This link has expired or was already used.</p>
            <a className="btn" href="/admin/forgot-password">Get a new link</a>
          </>
        )}
      </div>
    </main>
  );
}
