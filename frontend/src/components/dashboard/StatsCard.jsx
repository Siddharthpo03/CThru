import { ArrowUpRight } from "lucide-react";

export default function StatsCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400">{title}</p>

          <h2 className="mt-2 text-4xl font-bold">{value}</h2>

          <p className="mt-2 text-sm text-green-400">{subtitle}</p>
        </div>

        <div className="rounded-lg bg-indigo-600/20 p-4">
          <Icon size={28} className="text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
