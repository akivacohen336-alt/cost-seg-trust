import { notFound } from "next/navigation";
import { loadClientFolder } from "@/lib/clients";
import { deleteClientFile, saveClientNotes } from "../../../client-actions";
import ClientFileUpload from "@/components/ClientFileUpload";
import { StagePill, dateOnly, dateTime, usd } from "@/components/ui";

export const dynamic = "force-dynamic";

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function ClientFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const f = await loadClientFolder(id);
  if (!f) notFound();
  const { client: c, deals, uploads, proposals, reports, messages } = f;
  const fileCount = uploads.length + proposals.length + reports.length;

  return (
    <>
      <div><a className="btn sm" href="/admin/clients">← All clients</a></div>
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="page-title">
          <div>
            <p className="small muted" style={{ margin: 0 }}>Client folder · since {dateOnly(c.created_at)}</p>
            <h1>{c.first_name} {c.last_name}</h1>
          </div>
          <span className="small muted">{deals.length} deal{deals.length === 1 ? "" : "s"} · {fileCount} file{fileCount === 1 ? "" : "s"}</span>
        </div>
        <dl className="facts">
          <div><dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>
          <div><dt>Phone</dt><dd>{c.phone ? <a href={`tel:${String(c.phone).replace(/[^\d+]/g, "")}`}>{c.phone}</a> : "—"}</dd></div>
          <div><dt>HubSpot contact</dt><dd>{c.hubspot_contact_id ?? "Not synced"}</dd></div>
        </dl>
      </div>

      <div className="cols">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3>Deals</h3>
            {deals.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No deals yet.</p> : (
              <div className="tablewrap">
                <table>
                  <thead><tr><th>Deal</th><th>Property</th><th>Price</th><th>Stage</th><th>Partner</th><th>Received</th></tr></thead>
                  <tbody>
                    {deals.map(d => (
                      <tr key={d.id}>
                        <td><a className="rowlink" href={`/admin/deals/${d.id}`}>CST-{d.number}</a></td>
                        <td>{d.property_type}<div className="small muted">{d.property_address}</div></td>
                        <td className="num">{usd(d.purchase_price)}</td>
                        <td><StagePill stage={d.stage} /></td>
                        <td className="small">{d.partner_id ? <a href={`/admin/partners/${d.partner_id}`}>{d.partner_name}</a> : "—"}</td>
                        <td className="small">{dateOnly(d.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ display: "grid", gap: 12 }}>
            <h3>Files</h3>
            <ClientFileUpload clientId={c.id} deals={deals.map(d => ({ id: d.id, number: d.number }))} />
            {fileCount === 0 ? <p className="small muted" style={{ margin: 0 }}>No files yet. Supplier proposals and comparison PDFs show up here automatically.</p> : (
              <div className="tablewrap">
                <table>
                  <thead><tr><th>File</th><th>Kind</th><th>Deal</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={`r${r.id}`}>
                        <td><a href={`/admin/files/report/${r.id}`} target="_blank" rel="noreferrer">{r.filename}</a></td>
                        <td className="small">Comparison v{r.version}{r.sent_at ? <> · <span className="pill good">Sent</span></> : null}</td>
                        <td className="small">CST-{r.deal_number}</td>
                        <td className="small">{dateOnly(r.created_at)}</td><td />
                      </tr>
                    ))}
                    {proposals.map(p => (
                      <tr key={`p${p.id}`}>
                        <td><a href={`/admin/files/proposal/${p.id}`} target="_blank" rel="noreferrer">{p.filename}</a></td>
                        <td className="small">Proposal from {p.company_name}</td>
                        <td className="small">CST-{p.deal_number}</td>
                        <td className="small">{dateOnly(p.created_at)}</td><td />
                      </tr>
                    ))}
                    {uploads.map(u => (
                      <tr key={`u${u.id}`}>
                        <td><a href={`/admin/files/client/${u.id}`} target="_blank" rel="noreferrer">{u.filename}</a> <span className="small muted">{kb(u.size_bytes)}</span></td>
                        <td className="small">Uploaded by you</td>
                        <td className="small">{u.deal_number ? `CST-${u.deal_number}` : "—"}</td>
                        <td className="small">{dateOnly(u.created_at)}</td>
                        <td><form action={deleteClientFile}><input type="hidden" name="fileId" value={u.id} /><button className="btn sm" type="submit">Delete</button></form></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <form className="card" action={saveClientNotes} style={{ display: "grid", gap: 10 }}>
            <h3>Notes on this client</h3>
            <input type="hidden" name="clientId" value={c.id} />
            <textarea name="notes" defaultValue={c.notes ?? ""} placeholder="Private notes, e.g. CPA name, preferences, follow-ups" style={{ minHeight: 140 }} />
            <div><button className="btn" type="submit">Save notes</button></div>
          </form>
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3>Website messages</h3>
            {messages.length === 0 ? <p className="small muted" style={{ margin: 0 }}>None from this email.</p> : (
              <ul className="timeline">
                {messages.map(m => (
                  <li key={m.id}><b>{m.topic}</b> {m.handled ? <span className="pill good">Handled</span> : <span className="pill warn">Open</span>}
                    <div className="small" style={{ whiteSpace: "pre-line" }}>{m.message}</div>
                    <div className="small muted">{dateTime(m.created_at)}</div></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
