import { listPartners, referralLink } from "@/lib/partners";
import { addPartner } from "../../partner-actions";
import { dateOnly, usd } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const partners = await listPartners();
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Partners</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            Referral partners. Clients who come through a partner&apos;s link are tagged to that partner, and each partner has a private page to follow their deals.
          </p>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="card muted">No partners yet. Add your first one below.</div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Partner</th><th>Referral link</th><th>Deals</th><th>Open</th><th>Won</th><th>Commission</th><th>Last deal</th><th>Status</th></tr></thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id}>
                  <td><a className="rowlink" href={`/admin/partners/${p.id}`}>{p.name}</a>{p.company ? <div className="small muted">{p.company}</div> : null}</td>
                  <td className="small">{referralLink(p.code).replace(/^https?:\/\//, "")}</td>
                  <td className="num">{p.deals}</td>
                  <td className="num">{p.open}</td>
                  <td className="num">{p.won}</td>
                  <td className="num">{Number(p.commission_total) ? <>{usd(p.commission_total)}<div className="small muted">{usd(p.commission_paid)} paid</div></> : "—"}</td>
                  <td className="small">{p.last_deal_at ? dateOnly(p.last_deal_at) : "—"}</td>
                  <td>{p.active ? <span className="pill good">Active</span> : <span className="pill">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="card" action={addPartner} style={{ display: "grid", gap: 12 }}>
        <h3>Add a partner</h3>
        <div className="grid2">
          <label className="field">Name<input type="text" name="name" required /></label>
          <label className="field">Company <span className="opt">optional</span><input type="text" name="company" /></label>
          <label className="field">Email <span className="opt">optional</span><input type="email" name="email" /></label>
          <label className="field">Phone <span className="opt">optional</span><input type="tel" name="phone" /></label>
          <label className="field">Link code <span className="opt">optional, made from the name if blank</span><input type="text" name="code" placeholder="e.g. smith" /></label>
          <label className="field">Commission terms <span className="opt">optional</span><input type="text" name="commission" placeholder="e.g. 10% of our fee" /></label>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Adding a partner sends them nothing. You copy their links from their page and share them yourself.</p>
        <div><button className="btn dark" type="submit">Add partner</button></div>
      </form>
    </>
  );
}
