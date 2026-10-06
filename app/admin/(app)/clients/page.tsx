import { searchClients } from "@/lib/clients";
import { StagePill, dateOnly } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim().slice(0, 100) || null;
  const clients = await searchClients(q);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Clients</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Each client has a folder with their deals, files and notes.</p>
        </div>
      </div>
      <form className="filters card" method="get" role="search">
        <label className="field" style={{ flex: 1 }}>Search clients
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Name, email, phone, property address or CST number" autoFocus />
        </label>
        <button className="btn dark" type="submit">Search</button>
        {q ? <a className="btn" href="/admin/clients">Clear</a> : null}
      </form>
      {clients.length === 0 ? (
        <div className="card muted">{q ? `No clients match “${q}”.` : "No clients yet. They appear here when someone requests a quote."}</div>
      ) : (
        <>
          {q ? <p className="small muted" style={{ margin: 0 }}>{clients.length} client{clients.length === 1 ? "" : "s"} found</p> : null}
          <div className="folder-grid">
            {clients.map(c => (
              <a key={c.id} className="folder card" href={`/admin/clients/${c.id}`}>
                <div className="folder-tab" aria-hidden="true" />
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <b>{c.first_name} {c.last_name}</b>
                  {c.latest_stage ? <StagePill stage={c.latest_stage} /> : null}
                </div>
                <div className="small muted">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                {c.latest_address ? <div className="small">{c.latest_address}</div> : null}
                <div className="small muted">
                  {c.deals} deal{c.deals === 1 ? "" : "s"} · {c.files} file{c.files === 1 ? "" : "s"}
                  {c.last_deal_at ? ` · last request ${dateOnly(c.last_deal_at)}` : ""}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
