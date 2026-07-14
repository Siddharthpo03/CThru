import {
  History,
  LayoutDashboard,
  LogOut,
  SearchCheck,
  Settings,
  User,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "New Review",
    icon: SearchCheck,
    path: "/review",
  },
  {
    title: "History",
    icon: History,
    path: "/history",
  },
  {
    title: "Profile",
    icon: User,
    path: "/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();

    toast.success("Signed out successfully.");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <NavLink to="/dashboard" className="text-2xl font-bold tracking-tight">
          <span className="text-indigo-600">C</span>

          <span className="text-zinc-900 dark:text-white">Thru</span>
        </NavLink>
      </div>

      <nav className="flex-1 p-4">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Workspace
        </p>

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                }`
              }
            >
              <Icon size={19} />

              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut size={19} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
