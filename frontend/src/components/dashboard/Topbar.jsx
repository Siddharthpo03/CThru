import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div className="flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-2">
        <Search size={18} />
        <input
          placeholder="Search reviews..."
          className="bg-transparent outline-none"
        />
      </div>

      <div className="flex items-center gap-5">
        <Bell className="cursor-pointer" />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-semibold">
          S
        </div>
      </div>
    </header>
  );
}
