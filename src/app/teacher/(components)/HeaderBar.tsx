import { logout } from "../(actions)/logout";

export default function HeaderBar({ name }: { name: string }) {
  return (
    <header className="glass m-4 p-4 rounded-xl animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Teacher Dashboard</div>
        <div className="flex items-center gap-4">
          <span className="text-neutral-600 dark:text-neutral-400">{name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
