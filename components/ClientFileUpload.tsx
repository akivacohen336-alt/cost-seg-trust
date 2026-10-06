"use client";

import { useActionState, useRef } from "react";
import { uploadClientFile } from "@/app/admin/client-actions";

export default function ClientFileUpload({ clientId, deals }: { clientId: string; deals: { id: string; number: number }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: unknown, form: FormData) => {
    const r = await uploadClientFile(prev, form);
    if (r.ok) ref.current?.reset();
    return r;
  }, null);
  return (
    <form ref={ref} action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="clientId" value={clientId} />
      <div className="row">
        <input type="file" name="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" aria-label="File to add" />
        {deals.length > 1 ? (
          <select name="dealId" defaultValue="" style={{ maxWidth: 200 }} aria-label="Deal this file belongs to">
            <option value="">Not tied to one deal</option>
            {deals.map(d => <option key={d.id} value={d.id}>CST-{d.number}</option>)}
          </select>
        ) : deals[0] ? <input type="hidden" name="dealId" value={deals[0].id} /> : null}
        <button className="btn dark" type="submit" disabled={pending}>{pending ? "Uploading…" : "Add file"}</button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>PDF, image, Word, Excel, CSV or text, up to 4 MB.</p>
      {state ? <p className={`notice ${state.ok ? "ok" : "bad"}`} style={{ margin: 0 }} role="status">{state.message}</p> : null}
    </form>
  );
}
