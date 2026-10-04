"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <main className="login">
      <form className="card" action={action} style={{ display: "grid", gap: 14 }}>
        <div>
          <div className="brand">Cost Seg <span>Trust</span></div>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Admin sign in</p>
        </div>
        <label className="field">Email<input type="email" name="email" autoComplete="username" required defaultValue={state?.email ?? ""} key={state?.email ?? ""} /></label>
        <label className="field">Password<input type="password" name="password" autoComplete="current-password" required /></label>
        {state?.error ? <p className="notice bad" role="alert" style={{ margin: 0 }}>{state.error}</p> : null}
        <button className="btn primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
