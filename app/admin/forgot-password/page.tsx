"use client";

import { useActionState } from "react";
import { forgotPassword } from "../team-actions";
import BrandMark from "@/components/BrandMark";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <main className="login">
      <form className="card" action={action} style={{ display: "grid", gap: 14 }}>
        <div>
          <div className="brand brand-row"><BrandMark />Cost Seg <span>Trust</span></div>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Forgot your password</p>
        </div>
        {state?.done ? (
          <p className="notice ok" style={{ margin: 0 }}>If that email has a login, a link to choose a new password is on its way. Check your inbox.</p>
        ) : (
          <>
            <label className="field">Your email<input type="email" name="email" autoComplete="username" required /></label>
            <button className="btn primary" type="submit" disabled={pending}>{pending ? "Sending…" : "Email me a link"}</button>
          </>
        )}
        <a className="small muted" href="/admin/login" style={{ textAlign: "center" }}>Back to sign in</a>
      </form>
    </main>
  );
}
