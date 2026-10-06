import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { loadDeal } from "@/lib/deals";
import { STAGES, stageLabel } from "@/lib/stages";
import { changeStage, retryHubSpot, saveNotes } from "../../../actions";
import { StagePill, StageSteps, SyncPill, dateOnly, dateTime, usd } from "@/components/ui";
import { BuildComparisonButton, InviteActions, SendToSuppliersForm } from "@/components/SupplierActions";
import { config } from "@/lib/config";
import { QUOTE_FIELDS, formatValue } from "@/lib/quote-fields";

const EVENT_TEXT: Record<string, (d: any) => string> = {
  created: () => "Quote request received from the website",
  owner_notified: d => `Owner alert: email ${d.email}, text ${d.sms}`,
  hubspot_synced: d => `Synced to HubSpot (contact ${d.contactId}, deal ${d.dealId})`,
  hubspot_failed: d => `HubSpot sync failed: ${d.error}`,
  stage_changed: d => `Stage changed to ${d.stage}${d.outcome ? ` (${d.outcome})` : ""}`,
  notes_updated: () => "Notes updated",
  supplier_invited: d => `Quote request sent to ${d.supplier} (email ${d.email})`,
  supplier_link_resent: d => `New link sent to ${d.supplier}`,
  supplier_reminded: d => `Reminder sent to ${d.supplier}`,
  supplier_submitted: d => `${d.supplier} submitted a quote${d.fee ? ` (${usd(d.fee)})` : ""}${d.late ? ", late" : ""}`,
  supplier_declined: d => `${d.supplier} declined${d.reason ? `: ${d.reason}` : ""}`,
  quote_window_closed: d => `Quote window closed: ${d.submitted} quoted, ${d.declined} declined, ${d.expired} didn't respond`,
  ai_standardized: d => `AI read ${d.supplier}'s proposal (${d.filled} filled, ${d.mismatches} mismatches)`,
  ai_failed: d => `AI couldn't read ${d.supplier}'s proposal: ${d.error}`,
  comparison_built: d => `Comparison built from ${d.quotes} quote(s), ${d.summary} summary`,
  pdf_generated: d => `Comparison PDF v${d.version} generated for approval`,
  sent_to_client: d => `Comparison PDF v${d.version} approved and emailed to ${d.to}`,
};

const INVITE_PILL: Record<string, [string, string]> = {
  invited: ["Sent", "info"], viewed: ["Opened", "info"], submitted: ["Quoted", "good"], declined: ["Declined", ""], expired: ["No response", "warn"],
};

const fmtMismatch = (key: string, v: unknown) => formatValue(v, QUOTE_FIELDS.find(f => f.key === key)?.kind ?? "text");

function timeLeft(due: Date) {
  const ms = new Date(due).getTime() - Date.now();
  if (ms <= 0) return "Past due";
  const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4);
  return `${h}h ${m}m left`;
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await loadDeal(id);
  if (!d) notFound();
  const sql = db();
  const [events, notes, invites, available, [comparison]] = await Promise.all([
    sql`select kind, detail, created_at from deal_events where deal_id = ${id} order by created_at desc, id desc limit 100`,
    sql`select channel, recipient, purpose, status, error, created_at from notifications where deal_id = ${id} order by created_at desc limit 50`,
    sql`select i.*, s.company_name, s.is_test, q.id as quote_id, q.fee, q.est_first_year_tax_savings, q.proposal_filename,
               q.proposal_pdf is not null as has_pdf, q.ai_status, q.ai_error, q.ai_mismatches, q.ai_filled_fields, q.comments
        from supplier_invites i join suppliers s on s.id = i.supplier_id left join supplier_quotes q on q.invite_id = i.id
        where i.deal_id = ${id} order by i.invited_at, s.company_name`,
    sql`select id, company_name, email::text as email, is_test from suppliers
        where active and id not in (select supplier_id from supplier_invites where deal_id = ${id}) order by is_test desc, company_name`,
    sql`select status from comparisons where deal_id = ${id}`,
  ]);
  const quoted = invites.filter(i => i.status === "submitted").length;
  const room = config.maxSuppliersPerDeal - invites.length;
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
          <div><dt>Client</dt><dd><a href={`/admin/clients/${d.client_id}`}>{d.first_name} {d.last_name}</a> <span className="small muted">(folder)</span></dd></div>
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

      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>Supplier quotes</h3>
          {invites.length ? <span className="small muted">{quoted} quoted · {invites.length} invited</span> : null}
        </div>
        {invites.length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Supplier</th><th>Status</th><th>Fee</th><th>Yr-1 savings</th><th>AI</th><th></th></tr></thead>
              <tbody>
                {invites.map(i => {
                  const [label, tone] = INVITE_PILL[i.status] ?? [i.status, ""];
                  const late = i.responded_at && new Date(i.responded_at) > new Date(i.due_at);
                  return (
                    <tr key={i.id}>
                      <td><b>{i.company_name}</b> {i.is_test ? <span className="pill info">Test</span> : null}
                        <div className="small muted">Sent {dateTime(i.invited_at)}{i.reminder_sent_at ? " · reminded" : ""}</div>
                        {i.proposal_filename ? <div className="small"><a href={`/admin/files/proposal/${i.quote_id}`} target="_blank" rel="noreferrer">{i.proposal_filename}</a></div> : null}
                        {i.comments ? <div className="small muted">“{i.comments}”</div> : null}
                        {i.decline_reason ? <div className="small muted">Reason: {i.decline_reason}</div> : null}
                      </td>
                      <td><span className={`pill ${tone}`}>{label}</span>{late ? <> <span className="pill warn">Late</span></> : null}
                        <div className="small muted">{["invited", "viewed"].includes(i.status) ? timeLeft(i.due_at) : i.responded_at ? dateTime(i.responded_at) : ""}</div></td>
                      <td className="num">{i.quote_id ? formatValue(i.fee == null ? null : Number(i.fee), "money") : "—"}</td>
                      <td className="num">{i.quote_id ? formatValue(i.est_first_year_tax_savings == null ? null : Number(i.est_first_year_tax_savings), "money") : "—"}</td>
                      <td className="small">
                        {!i.quote_id ? "—" : i.ai_status === "done" ? <span className="pill good">Read</span> : i.ai_status === "pending" ? <span className="pill info">Reading</span> : i.ai_status === "failed" ? <span className="pill bad" title={i.ai_error ?? ""}>Failed</span> : <span className="muted">Typed in</span>}
                        {i.ai_filled_fields?.length ? <div className="muted">Filled: {i.ai_filled_fields.map((k: string) => QUOTE_FIELDS.find(f => f.key === k)?.label ?? k).join(", ")}</div> : null}
                        {(i.ai_mismatches ?? []).map((m: any) => (
                          <div key={m.field} style={{ color: "var(--warn-ink)" }}>Check {m.label}: typed {fmtMismatch(m.field, m.typed)}, PDF says {fmtMismatch(m.field, m.pdf)}</div>
                        ))}
                      </td>
                      <td><InviteActions inviteId={i.id} dealId={d.id} quoteId={i.quote_id} hasPdf={!!i.has_pdf} canResend={["invited", "viewed", "expired"].includes(i.status)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>Not sent to any suppliers yet. Suppliers have {config.quoteWindowHours} hours to respond and get one reminder after {config.reminderAfterHours} hours.</p>}
        <SendToSuppliersForm dealId={d.id} room={room} suppliers={room > 0 ? (available as any) : []} />
        {quoted > 0 ? (
          <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <b className="small">One-page comparison {comparison ? <span className="pill">{comparison.status === "awaiting_approval" ? "Awaiting your approval" : comparison.status === "sent" ? "Sent to client" : "Draft"}</span> : null}</b>
            <BuildComparisonButton dealId={d.id} exists={!!comparison} />
          </div>
        ) : null}
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
