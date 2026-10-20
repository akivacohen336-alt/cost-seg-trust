"use client";

import { useActionState } from "react";
import { inviteTeamMember } from "@/app/admin/team-actions";
import CopyLink from "./CopyLink";

export default function TeamInviteForm() {
  const [state, action, pending] = useActionState(inviteTeamMember, {});
  return (
    <form action={action} className="card" style={{ display: "grid", gap: 12 }}>
      <b>Give someone a login</b>
      <div className="row" style={{ gap: 12, alignItems: "end" }}>
        <label className="field" style={{ flex: 1, minWidth: 180 }}>Name <span className="opt">optional</span><input type="text" name="name" /></label>
        <label className="field" style={{ flex: 2, minWidth: 220 }}>Email<input type="email" name="email" required /></label>
        <button className="btn primary" type="submit" disabled={pending}>{pending ? "Sending…" : "Send set-password email"}</button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>They get an email with a link to choose their own password. You never see it.</p>
      {state?.message ? <p className={`notice ${state.ok ? "ok" : "bad"}`} role="status" style={{ margin: 0 }}>{state.message}</p> : null}
      {state?.link && !state.ok ? <CopyLink value={state.link} label="Set-password link" /> : null}
    </form>
  );
}
