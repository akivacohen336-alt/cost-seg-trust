"use client";

import { useActionState, useState, useTransition } from "react";
import { buildComparisonAction, rerunAi, resendSupplierLink, sendToSuppliers } from "@/app/admin/deal-actions";

type Msg = { ok: boolean; message: string; link?: string } | null;
const Note = ({ msg }: { msg: Msg }) => (msg ? <p className={`notice ${msg.ok ? "ok" : "bad"}`} style={{ margin: 0 }} role="status">{msg.message}</p> : null);

export function SendToSuppliersForm({ dealId, suppliers, room }: {
  dealId: string; room: number;
  suppliers: { id: string; company_name: string; email: string; is_test: boolean }[];
}) {
  const [state, action, pending] = useActionState(sendToSuppliers, null);
  const [picked, setPicked] = useState<string[]>([]);
  if (suppliers.length === 0) {
    return <div style={{ display: "grid", gap: 10 }}><Note msg={state} /><p className="small muted" style={{ margin: 0 }}>{room <= 0 ? "This deal has the maximum of 10 suppliers." : "Every active supplier already has this deal. Add more on the Suppliers page."}</p></div>;
  }
  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  return (
    <form action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="dealId" value={dealId} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b className="small">Send to suppliers ({picked.length} of up to {room} picked)</b>
        <button type="button" className="btn sm" onClick={() => setPicked(picked.length ? [] : suppliers.slice(0, room).map(s => s.id))}>
          {picked.length ? "Clear" : "Pick all"}
        </button>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {suppliers.map(s => (
          <label key={s.id} className="check">
            <input type="checkbox" name="supplierId" value={s.id} checked={picked.includes(s.id)} onChange={() => toggle(s.id)}
              disabled={!picked.includes(s.id) && picked.length >= room} />
            <span>{s.company_name} <span className="muted small">{s.email}</span> {s.is_test ? <span className="pill info">Test</span> : null}</span>
          </label>
        ))}
      </div>
      <div><button className="btn dark" type="submit" disabled={pending || picked.length === 0}>{pending ? "Sending…" : "Send quote request"}</button></div>
      <p className="small muted" style={{ margin: 0 }}>Each supplier gets a private link by email. They see the property facts but never the client's name, contact details or street address.</p>
      <Note msg={state} />
    </form>
  );
}

export function InviteActions({ inviteId, dealId, quoteId, canResend, hasPdf }: {
  inviteId: string; dealId: string; quoteId: string | null; canResend: boolean; hasPdf: boolean;
}) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="row">
        {canResend ? <button className="btn sm" disabled={pending} onClick={() => start(async () => setMsg(await resendSupplierLink(inviteId, dealId)))}>Resend link</button> : null}
        {quoteId && hasPdf ? <button className="btn sm" disabled={pending} onClick={() => start(async () => setMsg(await rerunAi(quoteId, dealId)))}>{pending ? "Reading…" : "Re-run AI"}</button> : null}
      </div>
      {msg ? <span className={`small ${msg.ok ? "" : "muted"}`}>{msg.message}{msg.link ? <><br /><input type="text" readOnly value={msg.link} onFocus={e => e.currentTarget.select()} aria-label="New supplier link" /></> : null}</span> : null}
    </div>
  );
}

export function BuildComparisonButton({ dealId, exists }: { dealId: string; exists: boolean }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <div className="row">
      {exists ? <a className="btn dark" href={`/admin/deals/${dealId}/comparison`}>Open comparison</a> : null}
      <button className={`btn ${exists ? "" : "dark"}`} disabled={pending} onClick={() => start(async () => {
        const r = await buildComparisonAction(dealId);
        if (r.ok) window.location.href = `/admin/deals/${dealId}/comparison`; else setMsg(r);
      })}>{pending ? "Building…" : exists ? "Rebuild from latest quotes" : "Build side-by-side comparison"}</button>
      <Note msg={msg} />
    </div>
  );
}
