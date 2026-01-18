import { logout } from "../(actions)/logout";

export default function HeaderBar({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 border-b">
      <div className="text-lg font-bold">Teacher Dashboard</div>
      <div className="flex items-center gap-4">
        <span className="font-medium">{name}</span>
        <form action={logout}>
          <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
        </form>
      </div>
    </header>
  );
}
