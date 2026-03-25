import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <Sidebar />
      <Navbar />
      <main className="min-h-screen pt-16 md:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
