import { Sidebar } from "./Sidebar";
import { ClientProviders } from "@/components/teacher/ClientProviders";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          {children}
        </main>
      </div>
    </ClientProviders>
  );
}
