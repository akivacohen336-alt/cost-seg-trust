import AdminHeader from "@/components/AdminHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost Seg Trust · Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader />
      <main className="admin-main">{children}</main>
    </>
  );
}
