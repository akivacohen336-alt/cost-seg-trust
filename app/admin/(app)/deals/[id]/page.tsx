import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { loadDeal } from "@/lib/deals";
import { STAGES, stageLabel } from "@/lib/stages";
import { changeStage, retryHubSpot, saveNotes } from "../../../actions";
import { StagePill, StageSteps, SyncPill, dateOnly, dateTime, usd } from "@/components/ui";

const EVENT_TEXT: Record<string, (d: any) => string> = {
  created: () => "Quote request received from the website",
  owner_notified: d => `Owner alert: email ${d.email}, text ${d.sms}`,
  hubspot_synced: d => `Synced to HubSpot (contact ${d.contactId}, deal ${d.dealId})`,
  hubspot_failed: d => `HubSpot sync failed: ${d.error}`,
  stage_changed: d => `Stage changed to ${d.stage}${d.outcome ? ` (${d.outcome})` : ""}`,
  notes_updated: () => "Notes updated",
};

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await loadDeal(id);
  if (!d) notFound();
  const sql = db();
  const [events, notes] = await Promise.all([
    sql`select kind, detail, created_at from deal_events where deal_id = ${id} order by created_at desc, id desc limit 100`,
    sql`select channel, recipient, purpose, status, error, created_at from notifications where deal_id = ${id} order by created_at desc limit 50`,
  ]);
  const portal = process.env.HUBSPOT_PORTAL_ID;

  return (
    <>
      <div><a className="btn sm" href="/admin">← All deals</a></div>
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="page-title">
          <div>
            <p className="small muted" style={{ margin: 0 }}>CST-{d.number} · received {dateTime(d.created_at)}</p>
            <h1>{d.property_type} · {d.property_address}</h1>
          </div>
          <StagePill stage={d.stage} />
        </div>
        <StageSteps stage={d.stage} />
        <dl className="facts">
          <div><dt>Client</dt><dd>{d.first_name} {d.last_name}</dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${d.email}`}>{d.email}</a></dd></div>
          <div><dt>Phone</dt><dd><a href={`tel:${String(d.phone).replace(/\D/g, "")}`}>{d.phone}</a></dd></div>
          <div><dt>Purchase price</dt><dd className="num">{usd(d.purchase_price)}</dd></div>
          <div><dt>Placed in service</dt><dd>{dateOnly(d.placed_in_service)}</dd></div>
          <div><dt>Land value</dt><dd>{d.land_value || "—"}</dd></div>
          <div><dt>Renovation spend</dt><dd className="num">{usd(d.renovation_spend)}</dd></div>
          <div><dt>Has a CPA</dt><dd>{d.has_cpa == null ? "—" : d.has_cpa ? "Yes" : "No"}</dd></div>
          <div><dt>Source</dt><dd>{[d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(" / ") || "Website"}</dd></div>
          <div><dt>Contact consent</dt><dd>{d.consent_contact ? `Yes, ${dateTime(d.consent_at)}` : "No"}</dd></div>
        </dl>
        {d.client_notes ? <p style={{ margin: 0 }}><b>Client notes:</b> {d.client_notes}</p> : null}
      </div>

      <div className="cols">
        <div style={{ display: "grid", gap: 18 }}>
          <form className="card" action={changeStage} style={{ display: "grid", gap: 12 }}>
            <h3>Stage</h3>
            <input type="hidden" name="dealId" value={d.id} />
            <div className="row">
              <select name="stage" defaultValue={d.stage} style={{ maxWidth: 260 }}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select name="outcome" defaultValue={d.closed_outcome ?? ""} style={{ maxWidth: 200 }} aria-label="Outcome if closed">
                <option value="">Outcome (if closed)</option><option value="won">Won</option><option value="lost">Lost</option>
              </select>
              <button className="btn dark" type="submit">Update stage</button>
            </div>
            <p className="small muted" style={{ margin: 0 }}>The HubSpot deal moves to the same stage automatically.</p>
          </form>

          <form className="card" action={saveNotes} style={{ display: "grid", gap: 10 }}>
            <h3>Your notes</h3>
            <input type="hidden" name="dealId" value={d.id} />
            <textarea name="notes" defaultValue={d.admin_notes ?? ""} placeholder="Private notes about this deal" />
            <div><button className="btn" type="submit">Save notes</button></div>
          </form>

          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3>Supplier quotes</h3>
            <p className="muted small" style={{ margin: 0 }}>Sending deals to suppliers is the next stage of the build.</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><h3>HubSpot</h3><SyncPill status={d.hubspot_sync_status} /></div>
            {d.hubspot_deal_id ? (
              <p className="small" style={{ margin: 0 }}>
                Deal {portal ? <a href={`https://app.hubspot.com/contacts/${portal}/record/0-3/${d.hubspot_deal_id}`} target="_blank" rel="noreferrer">{d.hubspot_deal_id}</a> : d.hubspot_deal_id}
                {" · "}contact {d.hubspot_contact_id ?? "—"}{" · "}stage {stageLabel(d.stage)}
                {d.hubspot_synced_at ? <><br /><span className="muted">Last synced {dateTime(d.hubspot_synced_at)}</span></> : null}
              </p>
            ) : null}
            {d.hubspot_error ? <p className="small" style={{ margin: 0, color: "var(--bad-ink)" }}>{d.hubspot_error}</p> : null}
            <form action={retryHubSpot}>
              <input type="hidden" name="dealId" value={d.id} />
              <button className="btn sm" type="submit">{d.hubspot_deal_id ? "Sync again" : "Retry HubSpot sync"}</button>
            </form>
          </div>

          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3>Alerts sent to you</h3>
            {notes.length === 0 ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
              <ul className="timeline">
                {notes.map((n, i) => (
                  <li key={i}>
                    <b>{n.channel === "email" ? "Email" : "Text"}</b> to {n.recipient}:{" "}
                    <span className={`pill ${n.status === "sent" ? "good" : n.status === "failed" ? "bad" : ""}`}>{n.status}</span>
                    {n.error ? <div className="small muted">{n.error}</div> : null}
                    <div className="small muted">{dateTime(n.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3>Activity</h3>
            <ul className="timeline">
              {events.map((e, i) => (
                <li key={i}>{(EVENT_TEXT[e.kind] ?? (() => e.kind))(e.detail)}<div className="small muted">{dateTime(e.created_at)}</div></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
