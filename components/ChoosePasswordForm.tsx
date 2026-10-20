"use client";

import { useActionState } from "react";
import { choosePassword } from "@/app/admin/team-actions";
import { MIN_PASSWORD } from "@/lib/team-rules";

export default function ChoosePasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(choosePassword, {});
  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="token" value={token} />
      <label className="field">Email<input type="email" name="email" autoComplete="username" value={email} readOnly /></label>
      <label className="field">New password <span className="opt">at least {MIN_PASSWORD} characters</span>
        <input type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
      </label>
      <label className="field">Type it again<input type="password" name="confirm" autoComplete="new-password" minLength={MIN_PASSWORD} required /></label>
      {state?.error ? <p className="notice bad" role="alert" style={{ margin: 0 }}>{state.error}</p> : null}
      <button className="btn primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save password and sign in"}</button>
    </form>
  );
}
