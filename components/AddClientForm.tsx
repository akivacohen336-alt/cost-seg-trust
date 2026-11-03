"use client";

import { useActionState } from "react";
import { addClientAction } from "@/app/admin/client-actions";
import { PROPERTY_TYPES } from "@/lib/stages";

export function AddClientForm() {
  const [state, action, pending] = useActionState(addClientAction, null);
  return (
    <form className="card" action={action} style={{ display: "grid", gap: 14 }}>
      <h3>Client</h3>
      <div className="grid2">
        <label className="field">Full name<input type="text" name="fullName" required autoComplete="off" /></label>
        <label className="field">Email<input type="email" name="email" required autoComplete="off" /></label>
        <label className="field">Phone <span className="opt">optional</span><input type="tel" name="phone" autoComplete="off" /></label>
      </div>
      <h3>Property</h3>
      <div className="grid2">
        <label className="field">Street address<input type="text" name="street" required /></label>
        <label className="field">City<input type="text" name="city" required /></label>
        <label className="field">State<input type="text" name="state" required placeholder="e.g. TX" maxLength={40} /></label>
        <label className="field">ZIP <span className="opt">optional</span><input type="text" name="zip" inputMode="numeric" maxLength={20} /></label>
        <label className="field">Property type<select name="propertyType" required defaultValue="">
          <option value="" disabled>Pick one</option>{PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="field">Purchase price ($) <span className="opt">needed before sending to vendors</span><input type="text" name="purchasePrice" inputMode="decimal" /></label>
        <label className="field">Purchase / in-service date <span className="opt">needed before sending to vendors</span><input type="date" name="placedInService" /></label>
        <label className="field">Land value <span className="opt">optional</span><input type="text" name="landValue" placeholder="e.g. $400,000 or 20%" /></label>
      </div>
      <label className="field">Notes <span className="opt">optional</span><textarea name="notes" placeholder="e.g. 1031 exchange, other properties, how they found us" /></label>
      {state?.error ? <p className="notice bad" role="alert" style={{ margin: 0 }}>{state.error}</p> : null}
      <div className="row">
        <button className="btn dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Add client"}</button>
        <a className="btn" href="/admin/clients">Cancel</a>
      </div>
      <p className="small muted" style={{ margin: 0 }}>This makes a new deal for the client, just like a website request. Nothing is emailed to the client or to any vendor.</p>
    </form>
  );
}
