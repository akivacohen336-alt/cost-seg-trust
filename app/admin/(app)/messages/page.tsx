import { listContactMessages } from "@/lib/contact";
import { dateTime } from "@/components/ui";
import { toggleMessageHandled } from "../../message-actions";

export default async function MessagesPage() {
  const messages = await listContactMessages();
  const open = messages.filter(m => !m.handled).length;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Messages</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            Sent from the website's Contact page. {open} open of {messages.length}.
          </p>
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="card muted">No messages yet.</div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Received</th><th>From</th><th>Topic</th><th>Message</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id}>
                  <td className="small" style={{ whiteSpace: "nowrap" }}>{dateTime(m.created_at)}</td>
                  <td>
                    <b>{m.full_name}</b>
                    <div className="small"><a href={`mailto:${m.email}`}>{m.email}</a></div>
                    {m.phone ? <div className="small"><a href={`tel:${String(m.phone).replace(/[^\d+]/g, "")}`}>{m.phone}</a></div> : null}
                  </td>
                  <td className="small">{m.topic}</td>
                  <td className="small" style={{ whiteSpace: "pre-line", minWidth: 260 }}>{m.message}</td>
                  <td>{m.handled ? <span className="pill good">Handled</span> : <span className="pill warn">Open</span>}</td>
                  <td>
                    <form action={toggleMessageHandled}><input type="hidden" name="id" value={m.id} />
                      <button className="btn sm" type="submit">{m.handled ? "Reopen" : "Mark handled"}</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
