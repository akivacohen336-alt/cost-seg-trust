"use client";

import { useState } from "react";
import { STUDY_TYPES } from "@/lib/quote-fields";

export default function SupplierQuoteForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState<"" | "submitted" | "declined">("");
  const [declining, setDeclining] = useState(false);

  async function send(body: FormData, kind: "submitted" | "declined") {
    setBusy(true); setError(""); setErrors({});
    try {
      const res = await fetch(`/api/supplier-quotes/${encodeURIComponent(token)}`, { method: "POST", body });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setDone(kind); window.scrollTo({ top: 0 }); return; }
      setErrors(j.fieldErrors ?? {});
      setError(j.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <div className="notice ok" role="status">{done === "declined" ? "Thanks for letting us know." : "Thank you. Your quote has been received."} You can close this page.</div>;
  }

  const err = (k: string) => (errors[k] ? <span className="err">{errors[k]}</span> : null);
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const } : {});
  const num = (name: string, label: string, hint?: string) => (
    <label className="field">{label}{hint ? <span className="opt"> {hint}</span> : null}
      <input type="text" inputMode="decimal" name={name} {...inv(name)} />{err(name)}</label>
  );
  const yesNo = (name: string, label: string) => (
    <label className="field">{label}<select name={name} defaultValue=""><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
  );

  return (
    <>
      <form className="card" style={{ display: "grid", gap: 14 }} onSubmit={e => { e.preventDefault(); send(new FormData(e.currentTarget), "submitted"); }}>
        <div>
          <h2 style={{ fontSize: "1.15rem" }}>Your quote</h2>
          <p className="small muted" style={{ margin: "4px 0 0" }}>Fill in what you can. If you attach your proposal PDF, we read the numbers from it, so blank fields are fine.</p>
        </div>
        <label className="field">Proposal PDF <span className="opt">optional, up to 4 MB</span>
          <input type="file" name="proposal" accept="application/pdf" />
        </label>
        <div className="grid2">
          {num("fee", "Study fee ($)")}
          <label className="field">Study type<select name="studyType" defaultValue=""><option value="">Select</option>{STUDY_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
          {yesNo("siteVisit", "Site visit included")}
          {num("turnaroundDays", "Turnaround (days)")}
          {num("reclassifiedPct", "% of basis reclassified")}
          {num("firstYearDeduction", "Est. first-year deduction ($)")}
          {num("firstYearTaxSavings", "Est. first-year tax savings ($)")}
          {num("assumedTaxRate", "Assumed tax rate (%)")}
          <label className="field">Audit support<input type="text" name="auditSupport" placeholder="e.g. Full audit defense included" /></label>
          {yesNo("includesLookback", "Look-back / Form 3115 included")}
          <label className="field">Payment terms<input type="text" name="paymentTerms" placeholder="e.g. 50% upfront, 50% on delivery" /></label>
          {num("validDays", "Quote valid for (days)")}
        </div>
        <label className="field">Comments <span className="opt">optional</span><textarea name="comments" /></label>
        {error ? <p className="notice bad" role="alert" style={{ margin: 0 }}>{error}</p> : null}
        <div className="row">
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Submit quote"}</button>
          <button className="btn" type="button" onClick={() => setDeclining(v => !v)} disabled={busy}>Decline to quote</button>
        </div>
      </form>
      {declining ? (
        <form className="card" style={{ display: "grid", gap: 10 }} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); f.set("action", "decline"); send(f, "declined"); }}>
          <label className="field">Reason <span className="opt">optional</span><input type="text" name="reason" placeholder="e.g. At capacity this month" /></label>
          <div><button className="btn" type="submit" disabled={busy}>Confirm decline</button></div>
        </form>
      ) : null}
    </>
  );
}
