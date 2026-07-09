import {
  LayoutDashboard,
  SearchCheck,
  History,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const menu = [
  { icon: LayoutDashboard, title: "Dashboard" },
  { icon: SearchCheck, title: "New Review" },
  { icon: History, title: "History" },
  { icon: User, title: "Profile" },
  { icon: Settings, title: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-bold text-indigo-400">CThru</h1>
      </div>

      <nav className="flex-1 p-4">
        {menu.map(({ icon: Icon, title }) => (
          <button
            key={title}
            className="mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-zinc-900 hover:text-indigo-400"
          >
            <Icon size={20} />
            {title}
          </button>
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition hover:bg-red-600">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
