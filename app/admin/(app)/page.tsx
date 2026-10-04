import { db } from "@/lib/db";
import { PROPERTY_TYPES, STAGES, isStageKey } from "@/lib/stages";
import { StagePill, SyncPill, dateTime, usd } from "@/components/ui";

type Search = { stage?: string; type?: string; q?: string };

export default async function DealsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const stage = sp.stage && isStageKey(sp.stage) ? sp.stage : null;
  const type = sp.type && (PROPERTY_TYPES as readonly string[]).includes(sp.type) ? sp.type : null;
  const q = sp.q?.trim() || null;
  const like = q ? `%${q}%` : null;

  const sql = db();
  const deals = await sql`
    select d.id, d.number, d.created_at, d.stage, d.property_type, d.property_address, d.purchase_price,
           d.utm_source, d.utm_campaign, d.hubspot_sync_status, c.first_name, c.last_name, c.email::text as email
    from deals d join clients c on c.id = d.client_id
    where (${stage}::deal_stage is null or d.stage = ${stage}::deal_stage)
      and (${type}::text is null or d.property_type = ${type})
      and (${like}::text is null or c.first_name || ' ' || c.last_name ilike ${like} or c.email ilike ${like}
           or d.property_address ilike ${like} or ('CST-' || d.number) ilike ${like})
    order by d.created_at desc
    limit 500`;
  const counts = await sql`select stage, count(*)::int as n from deals group by stage`;
  const countOf = (k: string) => counts.find(c => c.stage === k)?.n ?? 0;
  const exportQs = new URLSearchParams(Object.entries({ stage: stage ?? "", type: type ?? "", q: q ?? "" }).filter(([, v]) => v)).toString();

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Deals</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Every quote request from the website lands here.</p>
        </div>
        <a className="btn sm" href={`/admin/export${exportQs ? `?${exportQs}` : ""}`}>Export CSV</a>
      </div>

      <div className="row">
        {STAGES.map(s => (
          <a key={s.key} className={`pill ${stage === s.key ? "info" : ""}`} style={{ textDecoration: "none", color: "inherit" }}
             href={`/admin?stage=${s.key}`}>{s.label}: {countOf(s.key)}</a>
        ))}
      </div>

      <form className="filters card" method="get">
        <label className="field">Search<input type="text" name="q" defaultValue={q ?? ""} placeholder="Name, email, address or CST number" /></label>
        <label className="field">Stage
          <select name="stage" defaultValue={stage ?? ""}><option value="">All stages</option>{STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </label>
        <label className="field">Property type
          <select name="type" defaultValue={type ?? ""}><option value="">All types</option>{PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </label>
        <button className="btn dark" type="submit">Apply</button>
        {(stage || type || q) ? <a className="btn" href="/admin">Clear</a> : null}
      </form>

      {deals.length === 0 ? (
        <div className="card muted">No deals {stage || type || q ? "match these filters" : "yet. New quote requests from the website will appear here"}.</div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Deal</th><th>Received</th><th>Client</th><th>Property</th><th>Price</th><th>Stage</th><th>HubSpot</th><th>Source</th></tr></thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.id}>
                  <td><a className="rowlink" href={`/admin/deals/${d.id}`}>CST-{d.number}</a></td>
                  <td className="num">{dateTime(d.created_at)}</td>
                  <td><b>{d.first_name} {d.last_name}</b><div className="small muted">{d.email}</div></td>
                  <td>{d.property_type}<div className="small muted">{d.property_address}</div></td>
                  <td className="num">{usd(d.purchase_price)}</td>
                  <td><StagePill stage={d.stage} /></td>
                  <td><SyncPill status={d.hubspot_sync_status} /></td>
                  <td className="small">{[d.utm_source, d.utm_campaign].filter(Boolean).join(" / ") || "Website"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
