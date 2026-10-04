import { db } from "@/lib/db";
import { addSupplier, toggleSupplier } from "../../actions";

export default async function SuppliersPage() {
  const suppliers = await db()`select * from suppliers order by is_test desc, company_name`;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Suppliers</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            Test suppliers send everything to your own inbox (akivacohen336+supplier-…@gmail.com), so you can run the whole workflow safely.
          </p>
        </div>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Company</th><th>Email</th><th>Type</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td><b>{s.company_name}</b><div className="small muted">{s.description}</div></td>
                <td className="small">{s.email}</td>
                <td>{s.is_test ? <span className="pill warn">Test</span> : <span className="pill info">Real</span>}</td>
                <td>{s.active ? <span className="pill good">Active</span> : <span className="pill">Inactive</span>}</td>
                <td>
                  <form action={toggleSupplier}><input type="hidden" name="id" value={s.id} />
                    <button className="btn sm" type="submit">{s.active ? "Deactivate" : "Activate"}</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card" action={addSupplier} style={{ display: "grid", gap: 12 }}>
        <h3>Add a supplier</h3>
        <div className="grid2">
          <label className="field">Company<input type="text" name="companyName" required /></label>
          <label className="field">Contact name <span className="opt">optional</span><input type="text" name="contactName" /></label>
          <label className="field">Quote email<input type="email" name="email" required /></label>
          <label className="field">Phone <span className="opt">optional</span><input type="tel" name="phone" /></label>
          <label className="field">Short description <span className="opt">optional</span><input type="text" name="description" /></label>
        </div>
        <label className="check"><input type="checkbox" name="isTest" defaultChecked /> This is a test supplier</label>
        <div><button className="btn dark" type="submit">Add supplier</button></div>
      </form>
    </>
  );
}
