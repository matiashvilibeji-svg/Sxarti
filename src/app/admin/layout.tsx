import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNavbar } from "@/components/admin/admin-navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <AdminSidebar />
      <AdminNavbar />
      <main className="min-h-screen pt-16 md:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
