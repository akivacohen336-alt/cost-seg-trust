"use client";

import { useState, useTransition } from "react";
import { runHubSpotSetup, sendTestAlert } from "@/app/admin/actions";

export default function SettingsActions({ hubspot, alerts }: { hubspot: boolean; alerts: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <h3>Checks</h3>
      <div className="row">
        <button className="btn dark" disabled={!hubspot || pending} onClick={() => start(async () => setMsg(await runHubSpotSetup()))}>
          Set up HubSpot pipeline
        </button>
        <button className="btn" disabled={!alerts || pending} onClick={() => start(async () => setMsg(await sendTestAlert()))}>
          Send me a test alert
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        HubSpot setup creates the "Cost Seg Trust" deal pipeline with your seven stages and a unique request-ID field that blocks duplicate deals. Running it again changes nothing.
      </p>
      {pending ? <p className="small muted" style={{ margin: 0 }}>Working…</p> : null}
      {msg ? <p className={`notice ${msg.ok ? "ok" : "bad"}`} style={{ margin: 0 }}>{msg.message}</p> : null}
    </div>
  );
}
