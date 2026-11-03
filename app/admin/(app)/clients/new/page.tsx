import { AddClientForm } from "@/components/AddClientForm";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Add a client</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>For a client who reached you by phone, email or in person.</p>
        </div>
      </div>
      <AddClientForm />
    </>
  );
}
