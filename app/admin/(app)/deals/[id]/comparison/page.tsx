import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { defaultClientMessage, loadComparison } from "@/lib/comparison";
import { COMPARISON_ROWS, QUOTE_FIELDS } from "@/lib/quote-fields";
import ComparisonEditor from "@/components/ComparisonEditor";
import { StagePill, dateTime } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const view = await loadComparison(id);
  if (!view) {
    return (
      <>
        <div><a className="btn sm" href={`/admin/deals/${id}`}>← Back to deal</a></div>
        <div className="card"><p style={{ margin: 0 }}>No comparison yet. Build it from the deal page once a supplier has quoted.</p></div>
      </>
    );
  }
  const { comparison: c, deal: d } = view;
  const reports = await db()`select id, version, filename, created_at, sent_at, sent_to from pdf_reports where comparison_id = ${c.id} order by version desc`;
  return (
    <>
      <div><a className="btn sm" href={`/admin/deals/${id}`}>← Back to CST-{d.number}</a></div>
      <div className="page-title">
        <div>
          <p className="small muted" style={{ margin: 0 }}>CST-{d.number} · {d.first_name} {d.last_name} · {d.email}</p>
          <h1>Comparison: {d.property_type} · {d.property_address}</h1>
        </div>
        <StagePill stage={d.stage} />
      </div>
      <ComparisonEditor
        dealId={id}
        status={c.status}
        summarySource={c.summary_source ?? ""}
        initial={{ summary: c.summary ?? "", anonymize: !!c.anonymize, hiddenRows: c.hidden_rows ?? [], hiddenInvites: c.hidden_invites ?? [], overrides: c.overrides ?? {} }}
        quotes={view.quotes.map(q => ({ inviteId: q.inviteId, supplier: q.supplier, values: q.values, aiFilled: q.aiFilled, mismatches: q.mismatches, notes: q.notes }))}
        rows={COMPARISON_ROWS}
        fields={QUOTE_FIELDS.map(f => ({ key: f.key, kind: f.kind }))}
        reports={reports.map(r => ({ id: r.id, version: r.version, filename: r.filename, created: dateTime(r.created_at), sent: r.sent_at ? `${dateTime(r.sent_at)} to ${r.sent_to}` : null }))}
        defaultMessage={c.client_message ?? defaultClientMessage(d, view.columns.length)}
        clientEmail={d.email}
      />
    </>
  );
}
