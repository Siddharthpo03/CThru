import { Bell, Search } from "lucide-react";

import ThemeToggle from "../ui/ThemeToggle";

import { useAuth } from "../../contexts/AuthContext";

export default function Topbar() {
  const { user } = useAuth();

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex w-80 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search reviews..."
          className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        <div className="ml-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white">
            {initial}
          </div>

          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {user?.name || "CThru User"}
            </p>

            <p className="max-w-48 truncate text-xs text-zinc-500">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
