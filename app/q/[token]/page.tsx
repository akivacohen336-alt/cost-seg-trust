import { findInvite, markViewed, supplierFacts } from "@/lib/suppliers";
import SupplierQuoteForm from "@/components/SupplierQuoteForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost Seg Trust · Quote request", robots: { index: false } };

const due = (d: Date) =>
  new Date(d).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" });

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-hdr"><div className="wrap"><span className="brand">Cost Seg <span>Trust</span></span><div className="spacer" /><span className="small muted">Supplier quote</span></div></header>
      <main className="wrap" style={{ maxWidth: 900, paddingBlock: "28px 64px", display: "grid", gap: 18 }}>{children}</main>
    </>
  );
}

export default async function SupplierQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findInvite(token);
  if (!found) {
    return <Shell><div className="card"><h1 style={{ fontSize: "1.4rem" }}>This link isn't valid</h1><p className="muted" style={{ marginBottom: 0 }}>Please use the most recent link from your Cost Seg Trust email, or reply to that email and we'll send a new one.</p></div></Shell>;
  }
  const { invite, deal } = found;
  if (invite.status === "submitted" || invite.status === "declined") {
    return <Shell><div className="notice ok">Thank you, {invite.company_name}. We've received your {invite.status === "declined" ? "response" : "quote"} for CST-{deal.number}.</div></Shell>;
  }
  await markViewed(invite.id);
  const late = new Date(invite.due_at) < new Date();
  return (
    <Shell>
      <div>
        <p className="small muted" style={{ margin: 0 }}>Private quote link for <b>{invite.company_name}</b> · CST-{deal.number}</p>
        <h1 style={{ fontSize: "1.6rem", marginTop: 4 }}>Quote request: {deal.property_type}{deal.property_city_state ? ` in ${deal.property_city_state}` : ""}</h1>
        <p style={{ margin: "8px 0 0" }} className={late ? "" : "muted"}>
          {late ? <b style={{ color: "var(--bad-ink)" }}>The response window closed {due(invite.due_at)}. You can still send your quote and we'll consider it.</b> : <>Please respond by <b>{due(invite.due_at)}</b>.</>}
        </p>
      </div>
      <div className="card">
        <dl className="facts">{supplierFacts(deal).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
      <SupplierQuoteForm token={token} />
    </Shell>
  );
}
