"use client";

import { useActionState } from "react";
import { updateSupplierAction } from "@/app/admin/supplier-actions";

type Supplier = { id: string; company_name: string; contact_name: string | null; email: string; phone: string | null; description: string | null; is_test: boolean };

export function EditSupplierForm({ s }: { s: Supplier }) {
  const [state, action, pending] = useActionState(updateSupplierAction, null);
  return (
    <form className="card" action={action} style={{ display: "grid", gap: 12 }}>
      <input type="hidden" name="id" value={s.id} />
      <div className="grid2">
        <label className="field">Company<input type="text" name="companyName" required defaultValue={s.company_name} /></label>
        <label className="field">Contact name <span className="opt">optional</span><input type="text" name="contactName" defaultValue={s.contact_name ?? ""} /></label>
        <label className="field">Quote email<input type="email" name="email" required defaultValue={s.email} /></label>
        <label className="field">Phone <span className="opt">optional</span><input type="tel" name="phone" defaultValue={s.phone ?? ""} /></label>
        <label className="field">Short description <span className="opt">optional</span><input type="text" name="description" defaultValue={s.description ?? ""} /></label>
      </div>
      <p className="small muted" style={{ margin: 0 }}>Type: {s.is_test ? "Test" : "Real"}. Saving emails nobody.</p>
      {state?.error ? <p className="notice bad" role="alert" style={{ margin: 0 }}>{state.error}</p> : null}
      <div className="row">
        <button className="btn dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        <a className="btn" href="/admin/suppliers">Cancel</a>
      </div>
    </form>
  );
}
