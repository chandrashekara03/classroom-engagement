import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-100 h-full p-4 flex flex-col gap-4">
      <nav className="flex flex-col gap-2">
        <Link href="/teacher/dashboard" className="font-semibold">Dashboard</Link>
        <Link href="/teacher/templates" className="font-semibold">Templates</Link>
        <Link href="/teacher/session" className="font-semibold">Sessions</Link>
        <Link href="/teacher/analytics" className="font-semibold">Analytics</Link>
      </nav>
    </aside>
  );
}
