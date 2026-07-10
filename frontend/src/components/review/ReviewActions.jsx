import { Sparkles } from "lucide-react";

export default function ReviewActions() {
  return (
    <div className="flex justify-end">
      <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500">
        <Sparkles size={18} />
        Analyze Code
      </button>
    </div>
  );
}
