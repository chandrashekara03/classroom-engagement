import { Sidebar } from "./Sidebar";
import { ClientProviders } from "@/components/teacher/ClientProviders";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="pt-20 px-4 sm:px-6 pb-6 max-w-screen-2xl mx-auto">
          {children}
        </main>
      </div>
    </ClientProviders>
  );
}
