import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";

import ThemeToggle from "../ui/ThemeToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Code2 size={20} />
          </div>

          <span className="text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">C</span>

            <span className="text-zinc-900 dark:text-white">Thru</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            Features
          </a>

          <a
            href="#how"
            className="text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            How it Works
          </a>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:block"
          >
            Login
          </Link>

          <Link
            to="/review"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
