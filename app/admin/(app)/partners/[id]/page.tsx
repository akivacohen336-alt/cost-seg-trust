import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { portalLink, referralLink } from "@/lib/partners";
import { replacePortalLink, saveCommission, togglePartner, updatePartner } from "../../../partner-actions";
import CopyLink from "@/components/CopyLink";
import { StagePill, dateOnly, usd } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sql = db();
  const [p] = await sql`select *, email::text as email from partners where id = ${id}`;
  if (!p) notFound();
  const deals = await sql`
    select d.id, d.number, d.created_at, d.stage, d.closed_outcome, d.property_type, d.property_address, d.purchase_price,
           d.partner_commission, d.partner_commission_paid, c.id as client_id, c.first_name, c.last_name
    from deals d join clients c on c.id = d.client_id
    where d.partner_id = ${id} order by d.created_at desc`;
  const total = deals.reduce((s, d) => s + Number(d.partner_commission ?? 0), 0);
  const paid = deals.reduce((s, d) => s + (d.partner_commission_paid ? Number(d.partner_commission ?? 0) : 0), 0);
  let portal: string | null = null;
  try { portal = portalLink(p as any); } catch { /* SESSION_SECRET missing: shown below */ }

  return (
    <>
      <div><a className="btn sm" href="/admin/partners">← All partners</a></div>
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="page-title">
          <div>
            <p className="small muted" style={{ margin: 0 }}>Partner{p.commission ? ` · commission: ${p.commission}` : ""}</p>
            <h1>{p.name}{p.company ? <span className="muted" style={{ fontWeight: 400 }}> · {p.company}</span> : null}</h1>
          </div>
          {p.active ? <span className="pill good">Active</span> : <span className="pill">Inactive: link no longer tags deals, page is closed</span>}
        </div>
        <dl className="facts">
          <div><dt>Deals referred</dt><dd>{deals.length}</dd></div>
          <div><dt>Open</dt><dd>{deals.filter(d => d.stage !== "closed").length}</dd></div>
          <div><dt>Won</dt><dd>{deals.filter(d => d.closed_outcome === "won").length}</dd></div>
          <div><dt>Commission</dt><dd>{usd(total)} <span className="small muted">({usd(paid)} paid)</span></dd></div>
        </dl>
        <div style={{ display: "grid", gap: 6 }}>
          <b className="small">Referral link: partners send clients here. Deals that come through it are tagged to {p.name}.</b>
          <CopyLink value={referralLink(p.code)} label="Referral link" />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <b className="small">Partner page: {p.name}&apos;s private page to follow their deals. Anyone with this link can see it, so send it only to them.</b>
          {portal ? <CopyLink value={portal} label="Partner page link" /> : <p className="notice bad" style={{ margin: 0 }}>Set SESSION_SECRET to create partner page links.</p>}
          <div className="row">
            {portal ? <a className="btn sm" href={portal} target="_blank" rel="noreferrer">Preview their page</a> : null}
            <form action={replacePortalLink}><input type="hidden" name="id" value={p.id} />
              <button className="btn sm" type="submit">Replace page link (old one stops working)</button></form>
            <form action={togglePartner}><input type="hidden" name="id" value={p.id} />
              <button className="btn sm" type="submit">{p.active ? "Deactivate partner" : "Reactivate partner"}</button></form>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <h3>Deals from {p.name}</h3>
        {deals.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No deals yet. They appear here as soon as a client submits the quote form through the referral link, or when you tag a deal to this partner on the deal page.</p> : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Deal</th><th>Client</th><th>Property</th><th>Price</th><th>Stage</th><th>Commission</th></tr></thead>
              <tbody>
                {deals.map(d => (
                  <tr key={d.id}>
                    <td><a className="rowlink" href={`/admin/deals/${d.id}`}>CST-{d.number}</a><div className="small muted">{dateOnly(d.created_at)}</div></td>
                    <td><a href={`/admin/clients/${d.client_id}`}>{d.first_name} {d.last_name}</a></td>
                    <td>{d.property_type}<div className="small muted">{d.property_address}</div></td>
                    <td className="num">{usd(d.purchase_price)}</td>
                    <td><StagePill stage={d.stage} />{d.closed_outcome ? <div className="small muted">{d.closed_outcome === "won" ? "Won" : "Lost"}</div> : null}</td>
                    <td>
                      <form action={saveCommission} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                        <input type="hidden" name="dealId" value={d.id} />
                        <input type="text" inputMode="decimal" name="amount" aria-label="Commission amount" placeholder="$"
                               defaultValue={d.partner_commission == null ? "" : String(Number(d.partner_commission))} style={{ width: 90 }} />
                        <label className="check small"><input type="checkbox" name="paid" defaultChecked={d.partner_commission_paid} /> Paid</label>
                        <button className="btn sm" type="submit">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form className="card" action={updatePartner} style={{ display: "grid", gap: 12 }}>
        <h3>Edit partner</h3>
        <input type="hidden" name="id" value={p.id} />
        <div className="grid2">
          <label className="field">Name<input type="text" name="name" defaultValue={p.name} required /></label>
          <label className="field">Company <span className="opt">optional</span><input type="text" name="company" defaultValue={p.company ?? ""} /></label>
          <label className="field">Email <span className="opt">optional</span><input type="email" name="email" defaultValue={p.email ?? ""} /></label>
          <label className="field">Phone <span className="opt">optional</span><input type="tel" name="phone" defaultValue={p.phone ?? ""} /></label>
          <label className="field">Link code <span className="opt">changing it retires the old referral link</span><input type="text" name="code" defaultValue={p.code} /></label>
          <label className="field">Commission terms <span className="opt">optional</span><input type="text" name="commission" defaultValue={p.commission ?? ""} /></label>
        </div>
        <label className="field">Private notes <span className="opt">only you see these</span><textarea name="notes" defaultValue={p.notes ?? ""} /></label>
        <div><button className="btn dark" type="submit">Save</button></div>
      </form>
    </>
  );
}
