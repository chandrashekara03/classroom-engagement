import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-100 h-full p-4 flex flex-col gap-4">
      <nav className="flex flex-col gap-2">
        <Link href="#" className="font-semibold">Activity Templates</Link>
        <Link href="#" className="font-semibold">Classes</Link>
        <Link href="#" className="font-semibold">Sessions</Link>
        <Link href="#" className="font-semibold">Analytics</Link>
      </nav>
    </aside>
  );
}
