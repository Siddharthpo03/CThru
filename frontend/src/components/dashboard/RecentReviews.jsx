import { ArrowUpRight, MoreHorizontal } from "lucide-react";

const reviews = [
  {
    name: "Authentication Service",
    language: "JavaScript",
    score: 93,
    issues: 3,
    date: "Today",
  },
  {
    name: "Data Processor",
    language: "Python",
    score: 88,
    issues: 6,
    date: "Yesterday",
  },
  {
    name: "Student Management",
    language: "Java",
    score: 95,
    issues: 2,
    date: "2 days ago",
  },
  {
    name: "Sorting Algorithm",
    language: "C++",
    score: 76,
    issues: 9,
    date: "4 days ago",
  },
];

function ScoreBadge({ score }) {
  let style = "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";

  if (score >= 90) {
    style =
      "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";
  } else if (score >= 80) {
    style =
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
  }

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {score}/100
    </span>
  );
}

export default function RecentReviews() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Recent Reviews
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your latest code analysis results.
          </p>
        </div>

        <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-950/50">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Review
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Language
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Score
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Issues
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Date
              </th>

              <th className="w-12 px-6 py-3" />
            </tr>
          </thead>

          <tbody>
            {reviews.map((review) => (
              <tr
                key={review.name}
                className="border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {review.name}
                  </p>
                </td>

                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {review.language}
                </td>

                <td className="px-6 py-4">
                  <ScoreBadge score={review.score} />
                </td>

                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {review.issues}
                </td>

                <td className="px-6 py-4 text-sm text-zinc-500">
                  {review.date}
                </td>

                <td className="px-6 py-4">
                  <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
