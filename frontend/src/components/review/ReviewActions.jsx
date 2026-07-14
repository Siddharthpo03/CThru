import { LoaderCircle, Sparkles } from "lucide-react";

export default function ReviewActions({ onAnalyze, analyzing, disabled }) {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={disabled || analyzing}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {analyzing ? (
        <>
          <LoaderCircle size={19} className="animate-spin" />
          Analyzing code...
        </>
      ) : (
        <>
          <Sparkles size={19} />
          Analyze Code
        </>
      )}
    </button>
  );
}
