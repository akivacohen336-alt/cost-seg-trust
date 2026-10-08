import { ensureSchema } from "@/lib/migrate";
import { findPartnerByToken, partnerPortalDeals, referralLink } from "@/lib/partners";
import { config } from "@/lib/config";
import CopyLink from "@/components/CopyLink";
import { StagePill, dateOnly, usd } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost Seg Trust · Partner deals", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-hdr"><div className="wrap"><span className="brand">Cost Seg <span>Trust</span></span><div className="spacer" /><span className="small muted">Partner page</span></div></header>
      <main className="wrap" style={{ maxWidth: 960, paddingBlock: "28px 64px", display: "grid", gap: 18 }}>{children}</main>
    </>
  );
}

// A referral partner's private page: the deals they brought in and where each
// stands. Partners see the client's first name and last initial, never their
// contact details, street address or price.
export default async function PartnerPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await ensureSchema().catch(e => console.error("Database setup failed:", (e as Error).message));
  const partner = await findPartnerByToken(token).catch(() => null);
  if (!partner || !partner.active) {
    return <Shell><div className="card"><h1 style={{ fontSize: "1.4rem" }}>This link isn&apos;t active</h1><p className="muted" style={{ marginBottom: 0 }}>Please contact us at <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> for a current link.</p></div></Shell>;
  }
  const deals = await partnerPortalDeals(partner.id);
  const won = deals.filter(d => d.outcome === "won").length;
  const open = deals.filter(d => d.stage !== "closed").length;
  const showCommission = deals.some(d => d.commission != null);
  const earned = deals.reduce((s, d) => s + (d.commission ?? 0), 0);
  const paid = deals.reduce((s, d) => s + (d.commissionPaid ? d.commission ?? 0 : 0), 0);

  return (
    <Shell>
      <div>
        <p className="small muted" style={{ margin: 0 }}>Private page for <b>{partner.name}</b>{partner.company ? ` · ${partner.company}` : ""}</p>
        <h1 style={{ fontSize: "1.6rem", marginTop: 4 }}>Your referred deals</h1>
      </div>
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <b className="small">Your referral link. Send clients here and their requests are credited to you.</b>
        <CopyLink value={referralLink(partner.code)} label="Your referral link" />
      </div>
      <div className="card">
        <dl className="facts">
          <div><dt>Deals referred</dt><dd>{deals.length}</dd></div>
          <div><dt>In progress</dt><dd>{open}</dd></div>
          <div><dt>Won</dt><dd>{won}</dd></div>
          {showCommission ? <div><dt>Commission</dt><dd>{usd(earned)} <span className="small muted">({usd(paid)} paid)</span></dd></div> : null}
        </dl>
      </div>
      {deals.length === 0 ? (
        <div className="card muted">No deals yet. Deals appear here as soon as a client you sent submits a quote request.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {deals.map((d, i) => (
            <div key={d.number} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 18px", padding: "14px 18px", borderTop: i ? "1px solid var(--line)" : undefined }}>
              <div style={{ flex: "1 1 220px" }}>
                <b>CST-{d.number}</b> <span className="small muted">· {dateOnly(d.createdAt)}</span>
                <div>{d.client}</div>
                <div className="small muted">{d.property}</div>
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <StagePill stage={d.stage} />
                {d.outcome ? <div className="small muted">{d.outcome === "won" ? "Won" : "Not moving forward"}</div> : null}
              </div>
              {showCommission ? (
                <div className="num" style={{ flex: "0 0 120px", textAlign: "right" }}>
                  {d.commission == null ? <span className="muted">—</span> : <>{usd(d.commission)}<div className="small muted">{d.commissionPaid ? "Paid" : "Pending"}</div></>}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>Questions about a deal? Email <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> with the deal number.</p>
    </Shell>
  );
}
