"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAndSendAction, buildComparisonAction, generatePdfAction, saveComparisonAction, unlockAction } from "@/app/admin/deal-actions";
import { formatValue, savingsPerDollar, STUDY_TYPES } from "@/lib/quote-fields";

type Quote = { inviteId: string; supplier: string; values: Record<string, any>; aiFilled: string[]; mismatches: any[]; notes: any };
type Row = { key: string; label: string; kind: string; best?: "min" | "max" };
type Edits = { summary: string; anonymize: boolean; hiddenRows: string[]; hiddenInvites: string[]; overrides: Record<string, Record<string, any>> };

export default function ComparisonEditor(p: {
  dealId: string; status: string; summarySource: string; initial: Edits; quotes: Quote[]; rows: Row[];
  fields: { key: string; kind: string }[]; reports: { id: string; version: number; filename: string; created: string; sent: string | null }[];
  defaultMessage: string; clientEmail: string;
}) {
  const router = useRouter();
  const [e, setE] = useState<Edits>(p.initial);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "inviteId:key"
  const [message, setMessage] = useState(p.defaultMessage);
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const locked = p.status !== "draft";
  const kindOf = (k: string) => p.fields.find(f => f.key === k)?.kind;

  const update = (fn: (x: Edits) => Edits) => { setE(fn); setDirty(true); };
  const run = (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) => start(async () => {
    const r = await fn(); setMsg(r);
    if (r.ok) { setDirty(false); after?.(); router.refresh(); }
  });
  const save = () => run(() => saveComparisonAction(p.dealId, e));

  // What the client will see, live as you edit.
  const columns = useMemo(() => p.quotes.filter(q => !e.hiddenInvites.includes(q.inviteId)).map((q, i) => {
    const values: Record<string, any> = { ...q.values, ...(e.overrides[q.inviteId] ?? {}) };
    return { ...q, values: { ...values, savingsPerDollar: savingsPerDollar(values) } as Record<string, any>, name: e.anonymize ? `Provider ${String.fromCharCode(65 + i)}` : q.supplier };
  }), [p.quotes, e]);
  const rows = p.rows.filter(r => !e.hiddenRows.includes(r.key));
  const best: Record<string, number> = {};
  for (const r of rows) {
    if (!r.best) continue;
    const nums = columns.map(c => Number(c.values[r.key])).filter(n => isFinite(n) && n > 0);
    if (nums.length > 1) best[r.key] = r.best === "min" ? Math.min(...nums) : Math.max(...nums);
  }

  function setCell(inviteId: string, key: string, raw: string) {
    const kind = kindOf(key);
    let v: any = raw.trim();
    if (v === "") v = null;
    else if (kind === "money" || kind === "pct" || kind === "int") { const n = Number(String(v).replace(/[$,%\s]/g, "")); v = isFinite(n) ? n : null; }
    else if (kind === "bool") v = v === "yes" ? true : v === "no" ? false : null;
    update(x => ({ ...x, overrides: { ...x.overrides, [inviteId]: { ...(x.overrides[inviteId] ?? {}), [key]: v } } }));
  }

  function cellEditor(q: (typeof columns)[number], r: Row) {
    const kind = kindOf(r.key);
    const cur = q.values[r.key];
    const close = () => setEditing(null);
    if (kind === "bool") return (
      <select autoFocus defaultValue={cur === true ? "yes" : cur === false ? "no" : ""} onChange={ev => { setCell(q.inviteId, r.key, ev.target.value); close(); }} onBlur={close}>
        <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
      </select>);
    if (kind === "study") return (
      <select autoFocus defaultValue={cur ?? ""} onChange={ev => { setCell(q.inviteId, r.key, ev.target.value); close(); }} onBlur={close}>
        <option value="">—</option>{STUDY_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>);
    return <input type="text" autoFocus defaultValue={cur ?? ""} aria-label={`${q.name} ${r.label}`}
      onBlur={ev => { setCell(q.inviteId, r.key, ev.target.value); close(); }}
      onKeyDown={ev => { if (ev.key === "Enter") ev.currentTarget.blur(); if (ev.key === "Escape") close(); }} />;
  }

  const latest = p.reports[0];
  return (
    <>
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>Side-by-side comparison</h3>
          <span className={`pill ${p.status === "sent" ? "good" : p.status === "awaiting_approval" ? "warn" : ""}`}>
            {p.status === "sent" ? "Sent to client" : p.status === "awaiting_approval" ? "Awaiting your approval" : "Draft"}
          </span>
        </div>
        {!locked ? <p className="small muted" style={{ margin: 0 }}>Click any value to correct it. Green marks the best value in a row. Values the AI read from a proposal PDF are marked “AI”.</p> : null}
        <div className="tablewrap">
          <table>
            <thead><tr><th></th>{columns.map(c => <th key={c.inviteId} style={{ textTransform: "none", letterSpacing: 0, fontSize: ".86rem", color: "var(--heading)" }}>{c.name}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td><b className="small">{r.label}</b></td>
                  {columns.map(c => {
                    const isBest = best[r.key] != null && Number(c.values[r.key]) === best[r.key];
                    const isEditing = editing === `${c.inviteId}:${r.key}`;
                    const editable = !locked && r.key !== "savingsPerDollar";
                    const overridden = e.overrides[c.inviteId] && r.key in e.overrides[c.inviteId];
                    const mismatch = c.mismatches.find((m: any) => m.field === r.key);
                    return (
                      <td key={c.inviteId} className="num" style={isBest ? { background: "var(--good)", color: "var(--good-ink)", fontWeight: 700 } : undefined}>
                        {isEditing ? cellEditor(c, r) : (
                          <span onClick={() => editable && setEditing(`${c.inviteId}:${r.key}`)} style={editable ? { cursor: "text", borderBottom: "1px dashed var(--line)" } : undefined}>
                            {formatValue(c.values[r.key], r.kind)}
                          </span>
                        )}
                        {overridden ? <span className="small muted"> · edited</span> : c.aiFilled.includes(r.key) ? <span className="small muted"> · AI</span> : null}
                        {mismatch && !overridden ? <div className="small" style={{ color: "var(--warn-ink)", fontWeight: 500 }}>PDF says {formatValue(mismatch.pdf, r.kind)}</div> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="field">Summary for the client {p.summarySource ? <span className="opt">({p.summarySource.startsWith("ai") ? "written by AI, edit freely" : "standard summary; AI wasn't used"})</span> : null}
          <textarea value={e.summary} disabled={locked} onChange={ev => update(x => ({ ...x, summary: ev.target.value }))} style={{ minHeight: 110 }} />
        </label>
        {!locked ? (
          <details>
            <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Show or hide suppliers and rows</summary>
            <div className="grid2" style={{ marginTop: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label className="check"><input type="checkbox" checked={e.anonymize} onChange={ev => update(x => ({ ...x, anonymize: ev.target.checked }))} /> Hide supplier names (show “Provider A, B…”)</label>
                {p.quotes.map(q => (
                  <label key={q.inviteId} className="check"><input type="checkbox" checked={!e.hiddenInvites.includes(q.inviteId)}
                    onChange={ev => update(x => ({ ...x, hiddenInvites: ev.target.checked ? x.hiddenInvites.filter(i => i !== q.inviteId) : [...x.hiddenInvites, q.inviteId] }))} /> {q.supplier}</label>
                ))}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {p.rows.map(r => (
                  <label key={r.key} className="check"><input type="checkbox" checked={!e.hiddenRows.includes(r.key)}
                    onChange={ev => update(x => ({ ...x, hiddenRows: ev.target.checked ? x.hiddenRows.filter(k => k !== r.key) : [...x.hiddenRows, r.key] }))} /> {r.label}</label>
                ))}
              </div>
            </div>
          </details>
        ) : null}
        {columns.some(c => c.notes?.caveats?.length || c.notes?.exclusions?.length) ? (
          <details>
            <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>What the AI noticed in the proposals</summary>
            <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {columns.flatMap(c => [...(c.notes?.exclusions ?? []).map((t: string) => `${c.name} excludes: ${t}`), ...(c.notes?.caveats ?? []).map((t: string) => `${c.name}: ${t}`)]).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </details>
        ) : null}
        {!locked ? (
          <div className="row">
            <button className="btn" disabled={pending || !dirty} onClick={save}>{dirty ? "Save changes" : "Saved"}</button>
            <button className="btn" disabled={pending} onClick={() => run(async () => {
              if (dirty) { const s = await saveComparisonAction(p.dealId, e); if (!s.ok) return s; }
              const r = await buildComparisonAction(p.dealId);
              if (r.ok) window.location.reload();
              return { ...r, message: "Summary rewritten from the latest numbers." };
            })}>Rewrite summary</button>
            <button className="btn dark" disabled={pending || columns.length === 0} onClick={() => run(async () => {
              if (dirty) { const s = await saveComparisonAction(p.dealId, e); if (!s.ok) return s; }
              return generatePdfAction(p.dealId);
            })}>{pending ? "Working…" : "Generate PDF for approval"}</button>
          </div>
        ) : null}
        {msg ? <p className={`notice ${msg.ok ? "ok" : "bad"}`} style={{ margin: 0 }} role="status">{msg.message}</p> : null}
      </div>

      {latest ? (
        <div className="cols">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3>PDF v{latest.version}</h3>
              <a className="btn sm" href={`/admin/files/report/${latest.id}`} target="_blank" rel="noreferrer">Open full size</a>
            </div>
            <iframe title="Comparison PDF preview" src={`/admin/files/report/${latest.id}`} style={{ width: "100%", height: 520, border: "1px solid var(--line)", borderRadius: 8 }} />
          </div>
          <div className="card" style={{ display: "grid", gap: 10 }}>
            {p.status === "awaiting_approval" ? (
              <>
                <h3>Approve and send</h3>
                <p className="small muted" style={{ margin: 0 }}>Goes to <b>{p.clientEmail}</b> with the PDF attached. Replies come to you.</p>
                <textarea value={message} onChange={ev => setMessage(ev.target.value)} style={{ minHeight: 200 }} aria-label="Message to the client" />
                <div className="row">
                  <button className="btn primary" disabled={pending} onClick={() => {
                    if (confirm(`Email this comparison to ${p.clientEmail}?`)) run(() => approveAndSendAction(p.dealId, message));
                  }}>Approve &amp; send to client</button>
                  <button className="btn" disabled={pending} onClick={() => run(() => unlockAction(p.dealId))}>Make changes</button>
                </div>
              </>
            ) : p.status === "sent" ? (
              <><h3>Sent</h3><p className="small" style={{ margin: 0 }}>{latest.sent ?? "Sent."}</p></>
            ) : <><h3>Not approved yet</h3><p className="small muted" style={{ margin: 0 }}>Generate a new PDF when your edits are done.</p></>}
            {p.reports.length > 1 ? (
              <ul className="timeline">{p.reports.map(r => <li key={r.id}><a href={`/admin/files/report/${r.id}`} target="_blank" rel="noreferrer">v{r.version}</a> · {r.created}{r.sent ? ` · sent ${r.sent}` : ""}</li>)}</ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
