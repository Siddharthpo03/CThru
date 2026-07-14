import { ArrowRight, FileCode2, Upload } from "lucide-react";

import { Link } from "react-router-dom";

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Start analyzing your code.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/review"
          className="group flex items-center justify-between rounded-xl border border-zinc-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FileCode2 size={21} />
            </div>

            <div>
              <p className="font-medium text-zinc-900 dark:text-white">
                Paste Code
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Analyze a code snippet
              </p>
            </div>
          </div>

          <ArrowRight
            size={18}
            className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
          />
        </Link>

        <Link
          to="/review"
          className="group flex items-center justify-between rounded-xl border border-zinc-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Upload size={21} />
            </div>

            <div>
              <p className="font-medium text-zinc-900 dark:text-white">
                Upload File
              </p>

              <p className="mt-1 text-xs text-zinc-500">Review a source file</p>
            </div>
          </div>

          <ArrowRight
            size={18}
            className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
          />
        </Link>
      </div>
    </div>
  );
}
