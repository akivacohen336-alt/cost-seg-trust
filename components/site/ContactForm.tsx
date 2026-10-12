"use client";

import { useState } from "react";
import { CONTACT_TOPICS } from "@/lib/contact-topics";

type Errors = Record<string, string>;

export default function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(["fullName", "email", "phone", "topic", "message", "website"].map(k => [k, f.get(k) ?? ""]));
    setBusy(true); setErrors({}); setFormError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) { setSent(true); return; }
      setErrors(body.fieldErrors ?? {});
      setFormError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="s-form s-form-done" role="status">
        <h2>Thank you. Your message has been sent.</h2>
        <p>We'll reply by email as soon as we can. If it's urgent, you're welcome to call us.</p>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? <span className="s-err" id={`c-${k}-err`}>{errors[k]}</span> : null);
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `c-${k}-err` } : {});

  return (
    <form className="s-form" onSubmit={onSubmit} noValidate>
      <h2>Send us a message</h2>
      <div className="s-form-grid">
        <label className="s-field">Name<input type="text" name="fullName" autoComplete="name" required {...inv("fullName")} />{err("fullName")}</label>
        <label className="s-field">Email<input type="email" name="email" autoComplete="email" required {...inv("email")} />{err("email")}</label>
        <label className="s-field">Phone <span className="s-opt">optional</span><input type="tel" name="phone" autoComplete="tel" {...inv("phone")} />{err("phone")}</label>
        <label className="s-field">Topic
          <select name="topic" defaultValue={CONTACT_TOPICS[0]} {...inv("topic")}>{CONTACT_TOPICS.map(t => <option key={t}>{t}</option>)}</select>{err("topic")}
        </label>
      </div>
      <label className="s-field">Message<textarea name="message" rows={5} required {...inv("message")} />{err("message")}</label>
      <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {formError ? <p className="s-form-error" role="alert">{formError}</p> : null}
      <div className="s-form-foot">
        <button className="s-btn s-btn-primary s-btn-lg" type="submit" disabled={busy}>{busy ? "Sending…" : "Send Message"}</button>
        <span className="s-muted">Looking for quotes? <a href="/quote">Use the quote form</a> instead.</span>
      </div>
    </form>
  );
}
