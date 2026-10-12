"use client";

import { useEffect, useMemo, useState } from "react";
import { PROPERTY_TYPES } from "@/lib/stages";

type Errors = Record<string, string>;

export default function QuoteForm() {
  const requestKey = useMemo(() => crypto.randomUUID(), []);
  const [utm, setUtm] = useState({ utmSource: "", utmMedium: "", utmCampaign: "", ref: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; reference: string } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtm({ utmSource: p.get("utm_source") ?? "", utmMedium: p.get("utm_medium") ?? "", utmCampaign: p.get("utm_campaign") ?? "", ref: p.get("ref") ?? "" });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const payload = {
      requestKey,
      fullName: f.get("fullName"), email: f.get("email"), phone: f.get("phone"),
      propertyAddress: f.get("propertyAddress"), propertyType: f.get("propertyType"),
      purchasePrice: f.get("purchasePrice"), placedInService: f.get("placedInService"),
      landValue: f.get("landValue"), renovationSpend: f.get("renovationSpend"),
      hasCpa: f.get("hasCpa") || undefined, notes: f.get("notes"),
      consent: f.get("consent") === "on", website: f.get("website"), ...utm,
    };
    setBusy(true); setErrors({}); setFormError("");
    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setDone({ name: String(payload.fullName).trim().split(/\s+/)[0], reference: body.reference ?? "" });
        return;
      }
      setErrors(body.fieldErrors ?? {});
      setFormError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card" role="status" style={{ display: "grid", gap: 10 }}>
        <h3>Thanks, {done.name}. Your request is in.</h3>
        <p className="muted" style={{ margin: 0 }}>
          We're collecting quotes from our provider network and will be in touch shortly with your side-by-side comparison.
          {done.reference ? <> Your reference is <b>{done.reference}</b>.</> : null}
        </p>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? <span className="err" id={`${k}-err`}>{errors[k]}</span> : null);
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <h3 style={{ marginBottom: 14 }}>Tell us about your property</h3>
      <div className="grid2">
        <label className="field">Full name<input type="text" name="fullName" autoComplete="name" required {...inv("fullName")} />{err("fullName")}</label>
        <label className="field">Email<input type="email" name="email" autoComplete="email" required {...inv("email")} />{err("email")}</label>
        <label className="field">Phone<input type="tel" name="phone" autoComplete="tel" required {...inv("phone")} />{err("phone")}</label>
        <label className="field">Property address<input type="text" name="propertyAddress" placeholder="Street, City, ST" required {...inv("propertyAddress")} />{err("propertyAddress")}</label>
        <label className="field">Property type
          <select name="propertyType" defaultValue="Multifamily" {...inv("propertyType")}>{PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}</select>{err("propertyType")}
        </label>
        <label className="field">Purchase price ($)<input type="text" inputMode="decimal" name="purchasePrice" placeholder="1,250,000" required {...inv("purchasePrice")} />{err("purchasePrice")}</label>
        <label className="field">Purchase or placed-in-service date<input type="date" name="placedInService" required {...inv("placedInService")} />{err("placedInService")}</label>
        <label className="field">Approximate land value or % <span className="opt">optional</span><input type="text" name="landValue" {...inv("landValue")} />{err("landValue")}</label>
        <label className="field">Renovation spend ($) <span className="opt">optional</span><input type="text" inputMode="decimal" name="renovationSpend" {...inv("renovationSpend")} />{err("renovationSpend")}</label>
        <label className="field">Do you have a CPA?
          <select name="hasCpa" defaultValue=""><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select>
        </label>
      </div>
      <label className="field" style={{ marginTop: 14 }}>Notes <span className="opt">optional</span><textarea name="notes" {...inv("notes")} />{err("notes")}</label>
      <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="check" style={{ marginTop: 12 }}>
        <input type="checkbox" name="consent" {...inv("consent")} />
        <span>I agree to be contacted by email, phone and SMS about my quote. Message and data rates may apply. Reply STOP to opt out.</span>
      </label>
      {errors.consent ? <p className="small" style={{ color: "var(--bad-ink)", margin: "6px 0 0" }}>{errors.consent}</p> : null}
      {formError ? <p className="notice bad" style={{ marginTop: 12 }} role="alert">{formError}</p> : null}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary lg" type="submit" disabled={busy}>{busy ? "Sending…" : "Get My Free Quotes"}</button>
        <span className="small muted">Free, no obligation.</span>
      </div>
    </form>
  );
}
