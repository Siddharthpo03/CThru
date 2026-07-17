import {
  ArrowUpRight,
  MoreHorizontal,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { exportReviewAsPDF } from "../../utils/pdfExport.js";
// import CodeAnalysisEditor from "../components/editor/CodeAnalysisEditor";

function ScoreBadge({ score }) {
  let style = "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  if (score >= 90)
    style =
      "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";
  else if (score >= 80)
    style =
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {score}/100
    </span>
  );
}

// Inline Row Dropdown Menu Component
function RowActionsDropdown({ review }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the open drop panel if a user clicks outside the selection box container
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white transition"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 z-50 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <Link
            to={`/reviews/${review.id || review._id}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            <Eye size={15} />
            View Details
          </Link>

          <button
            onClick={() => {
              exportReviewAsPDF(review);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-left"
          >
            <FileText size={15} />
            Download PDF
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-900" />

          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this review?")) {
                // Future integration hook point for structural window drop deletions
              }
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-left"
          >
            <Trash2 size={15} />
            Delete Review
          </button>
        </div>
      )}
    </div>
  );
}

export default function RecentReviews({ reviews = [], loading = false }) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-12 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-800/40"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Recent Reviews
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {reviews.length === 0
              ? "No matching reviews found."
              : "Your latest code analysis results."}
          </p>
        </div>

        {/* FIXED: Changed from native static button to full browser routed Link context tracking */}
        <Link
          to="/history"
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition"
        >
          View all
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* Table Interface */}
      <div className="overflow-x-auto">
        {reviews.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No reviews found matching your search term. Try filtering by
              another title or language.
            </p>
          </div>
        ) : (
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

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {reviews.map((review) => (
                <tr
                  key={review.id || review._id || review.name}
                  className="border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/reviews/${review.id || review._id || ""}`}
                      className="font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      {review.title || review.name}
                    </Link>
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {review.language}
                  </td>

                  <td className="px-6 py-4">
                    <ScoreBadge
                      score={review.overallScore ?? review.score ?? 0}
                    />
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {review.metrics?.uniqueIssueCount ?? review.issues ?? 0}
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : review.date}
                  </td>

                  {/* FIXED: Replaced default empty icon button frame shell with explicit dropdown action engine */}
                  <td className="px-6 py-4 text-right">
                    <RowActionsDropdown review={review} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
