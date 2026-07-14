import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Code2 size={17} />
          </div>

          <span className="font-bold text-zinc-900 dark:text-white">CThru</span>
        </Link>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          © 2026 CThru. AI-powered code reviews.
        </p>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          See through your code.
        </p>
      </div>
    </footer>
  );
}
