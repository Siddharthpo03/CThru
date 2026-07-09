import { Upload, FileCode2 } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-semibold">Quick Actions</h2>

      <div className="mt-6 flex gap-4">
        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500">
          <FileCode2 size={18} />
          Paste Code
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-3 hover:border-indigo-500">
          <Upload size={18} />
          Upload File
        </button>
      </div>
    </div>
  );
}
