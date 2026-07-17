import React, { useState } from "react";
import { Code2, Play, Save, RotateCcw } from "lucide-react";

export default function CodeAnalysisEditor({
  initialCode = "",
  language = "javascript",
  onSave,
  onRetest,
}) {
  const [code, setCode] = useState(initialCode);

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm dark:border-zinc-800 overflow-hidden w-full h-[500px]">
      {/* Tab Controls Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center gap-2 text-zinc-400">
          <Code2 size={16} className="text-indigo-400" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {language} Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(initialCode)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <button
            onClick={() => onRetest?.(code)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <Play size={14} />
            Analyze Code
          </button>
        </div>
      </div>

      {/* Code Textarea Input Canvas */}
      <div className="flex-1 relative font-mono text-sm leading-6 p-4 overflow-auto">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-transparent text-zinc-100 outline-none resize-none font-mono"
          style={{ tabSize: 2 }}
          placeholder="// Paste or write your code framework here..."
        />
      </div>
    </div>
  );
}
