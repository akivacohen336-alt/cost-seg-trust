"use client";

import { useActionState, useEffect, useRef } from "react";
import { addQuoteByHandAction } from "@/app/admin/deal-actions";
import { STUDY_TYPES } from "@/lib/quote-fields";

/** For a vendor who emailed their proposal instead of using their link. Emails nobody. */
export function ManualQuoteForm({ dealId, vendors }: { dealId: string; vendors: { id: string; name: string; note?: string; isTest: boolean }[] }) {
  const [state, action, pending] = useActionState(addQuoteByHandAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  const num = (name: string, label: string, hint?: string) => (
    <label className="field">{label}{hint ? <span className="opt"> {hint}</span> : null}
      <input type="text" inputMode="decimal" name={name} /></label>
  );
  const yesNo = (name: string, label: string) => (
    <label className="field">{label}<select name={name} defaultValue=""><option value="">Not stated</option><option value="yes">Yes</option><option value="no">No</option></select></label>
  );
  return (
    <details className="manual-quote" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
      <summary><b className="small">Add a quote by hand</b> <span className="small muted">for a vendor who emailed their proposal</span></summary>
      {vendors.length === 0 ? <p className="small muted">Every vendor on this deal already has a quote.</p> : (
        <form ref={formRef} action={action} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input type="hidden" name="dealId" value={dealId} />
          <p className="small muted" style={{ margin: 0 }}>Copy the numbers from the vendor&apos;s proposal. Leave a box empty if the proposal doesn&apos;t state it; never estimate. Nothing is emailed to anyone.</p>
          <div className="grid2">
            <label className="field">Vendor<select name="supplierId" required defaultValue="">
              <option value="" disabled>Pick the vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}{v.isTest ? " (test)" : ""}{v.note ? ` · ${v.note}` : ""}</option>)}
            </select></label>
            <label className="field">Proposal PDF <span className="opt">optional, up to 4 MB</span><input type="file" name="proposal" accept="application/pdf" /></label>
            {num("fee", "Study fee ($)")}
            <label className="field">Study type<select name="studyType" defaultValue=""><option value="">Not stated</option>{STUDY_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
            {yesNo("siteVisit", "In-person site visit included")}
            {num("turnaroundDays", "Turnaround (days)", "shortest, if a range")}
            {num("turnaroundDaysHigh", "Longest turnaround (days)", "only if a range")}
            {num("depreciableBasis", "Depreciable basis used ($)")}
            {num("regularDepreciation", "Year-1 depreciation without a study ($)")}
            {num("firstYearDeduction", "Year-1 depreciation with the study ($)")}
            {num("firstYearDeductionHigh", "High end of year-1 depreciation ($)", "only if a range")}
            {num("increasedDeduction", "Extra year-1 deduction from the study ($)")}
            {num("acceleratedAmount", "Total moved to 5, 7 and 15-year ($)")}
            {num("reclassifiedPct", "% of basis reclassified")}
            {num("firstYearTaxSavings", "First-year tax benefit ($)")}
            {num("firstYearTaxSavingsHigh", "High end of the tax benefit ($)", "only if a range")}
            <label className="field">The tax benefit is figured on<select name="taxBenefitOn" defaultValue=""><option value="">Not stated</option>
              <option value="extra">The extra deduction from the study only</option><option value="total">All year-1 depreciation (incl. regular)</option></select></label>
            {num("assumedTaxRate", "Assumed tax rate (%)")}
            <label className="field">Scope of work<input type="text" name="scopeOfWork" /></label>
            <label className="field">Audit support<input type="text" name="auditSupport" /></label>
            {yesNo("includesLookback", "Look-back / Form 3115 included")}
            <label className="field">Form 3115 note<input type="text" name="lookbackNote" /></label>
            <label className="field">Payment terms<input type="text" name="paymentTerms" /></label>
            {num("validDays", "Quote valid for (days)")}
          </div>
          <label className="field">Notes <span className="opt">optional</span><textarea name="comments" /></label>
          <div><button className="btn dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Save quote"}</button></div>
          {state ? <p className={`notice ${state.ok ? "ok" : "bad"}`} style={{ margin: 0 }} role="status">{state.message}</p> : null}
        </form>
      )}
    </details>
  );
}
