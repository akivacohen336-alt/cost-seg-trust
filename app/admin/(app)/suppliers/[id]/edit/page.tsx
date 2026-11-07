import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditSupplierForm } from "@/components/EditSupplierForm";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [s] = await db()`select id, company_name, contact_name, email::text as email, phone, description, is_test from suppliers where id = ${id}`;
  if (!s) notFound();
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Edit supplier</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>{s.company_name}</p>
        </div>
      </div>
      <EditSupplierForm s={s as any} />
    </>
  );
}
