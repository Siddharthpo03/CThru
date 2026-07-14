import {
  AlertTriangle,
  ArrowLeft,
  Braces,
  Bug,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  CopyCheck,
  FileCode2,
  Layers3,
  Pencil,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import toast from "react-hot-toast";

import DashboardLayout from "../components/dashboard/DashboardLayout";

import { apiRequest } from "../services/api";

const severityStyles = {
  critical: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",

  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",

  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

function MetricCard({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>

          <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreStyles(score) {
  if (score >= 80) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",

      bar: "bg-emerald-500",

      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
  }

  if (score >= 60) {
    return {
      text: "text-amber-600 dark:text-amber-400",

      bar: "bg-amber-500",

      icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    };
  }

  return {
    text: "text-red-600 dark:text-red-400",

    bar: "bg-red-500",

    icon: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  };
}

function CategoryScoreCard({ icon: Icon, title, score }) {
  if (score === null || score === undefined) {
    return null;
  }

  const styles = getScoreStyles(score);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}
          >
            <Icon size={19} />
          </div>

          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </p>
        </div>

        <p className={`text-xl font-bold ${styles.text}`}>
          {score}
          <span className="text-sm font-medium text-zinc-400">/100</span>
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}

function formatAffectedLines(lineNumbers = []) {
  if (lineNumbers.length === 0) {
    return null;
  }

  const visibleLines = lineNumbers.slice(0, 5);

  const remaining = lineNumbers.length - visibleLines.length;

  const lineText = visibleLines.join(", ");

  if (remaining <= 0) {
    return `Line${visibleLines.length > 1 ? "s" : ""} ${lineText}`;
  }

  return `Lines ${lineText} +${remaining} more`;
}

export default function ReviewResults() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [review, setReview] = useState(null);

  const [loading, setLoading] = useState(true);

  const [correcting, setCorrecting] = useState(false);

  const [correction, setCorrection] = useState(null);

  const [correctionOpen, setCorrectionOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReview = async () => {
      try {
        const data = await apiRequest(`/reviews/${id}`);

        setReview(data.review);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [id]);

  const openReviewEditor = (code) => {
    navigate("/review", {
      state: {
        title: review.title,

        language: review.language,

        code,

        selectedAnalysis:
          review.selectedAnalysis ||
          review.reviewType?.split(",").filter(Boolean) ||
          [],
      },
    });
  };

  const handleEditCode = () => {
    openReviewEditor(review.sourceCode);
  };

  const handleRetest = () => {
    openReviewEditor(review.sourceCode);
  };

  const handleAutoCorrect = async () => {
    try {
      setCorrecting(true);

      const data = await apiRequest(`/reviews/${id}/auto-correct`, {
        method: "POST",
      });

      setCorrection(data.correction);

      setCorrectionOpen(true);

      toast.success("AI correction completed.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCorrecting(false);
    }
  };

  const handleCopyCorrectedCode = async () => {
    if (!correction?.correctedCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(correction.correctedCode);

      setCopied(true);

      toast.success("Corrected code copied.");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Unable to copy code.");
    }
  };

  const handleEditCorrectedCode = () => {
    if (!correction?.correctedCode) {
      return;
    }

    setCorrectionOpen(false);

    openReviewEditor(correction.correctedCode);
  };

  const handleRetestCorrectedCode = () => {
    if (!correction?.correctedCode) {
      return;
    }

    setCorrectionOpen(false);

    navigate("/review", {
      state: {
        title: `${review.title} - Corrected`,

        language: review.language,

        code: correction.correctedCode,

        selectedAnalysis:
          review.selectedAnalysis ||
          review.reviewType?.split(",").filter(Boolean) ||
          [],

        autoRun: true,
      },
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-800 dark:border-t-indigo-500" />

            <p className="mt-4 text-sm text-zinc-500">Loading review...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={42} className="mx-auto text-amber-500" />

            <h1 className="mt-4 text-xl font-semibold text-zinc-950 dark:text-white">
              Review not found
            </h1>

            <Link
              to="/dashboard"
              className="mt-5 inline-flex text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const score = review.overallScore || 0;

  const metrics = review.metrics || {};

  const findings = review.findings || [];

  const categoryScores = metrics.categoryScores || {};

  const rawDetectionCount =
    metrics.rawDetectionCount ??
    (metrics.staticIssueCount || 0) + (metrics.aiIssueCount || 0);

  const uniqueIssueCount = metrics.uniqueIssueCount ?? findings.length;

  const mergedDetectionCount =
    metrics.mergedDetectionCount ??
    Math.max(0, rawDetectionCount - uniqueIssueCount);

  const overallStyles = getScoreStyles(score);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <Link
          to="/review"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft size={17} />
          New Review
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Analysis Results
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {review.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-2">
                <Code2 size={16} />

                {review.language}
              </span>

              <span>•</span>

              <span>{new Date(review.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEditCode}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Pencil size={16} />
                Edit Code
              </button>

              <button
                type="button"
                onClick={handleRetest}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <RefreshCw size={16} />
                Retest
              </button>

              <button
                type="button"
                onClick={handleAutoCorrect}
                disabled={correcting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles
                  size={16}
                  className={correcting ? "animate-pulse" : ""}
                />

                {correcting ? "Correcting..." : "Auto Correct"}
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${overallStyles.icon}`}
              >
                {score >= 80 ? (
                  <CheckCircle2 size={27} />
                ) : (
                  <ShieldAlert size={27} />
                )}
              </div>

              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Overall Score
                </p>

                <p className="text-3xl font-bold text-zinc-950 dark:text-white">
                  {score}

                  <span className="text-base font-medium text-zinc-400">
                    /100
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {review.aiSummary && (
          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sparkles size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950 dark:text-white">
                  CThru AI Summary
                </h2>

                <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                  {review.aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <MetricCard
            icon={FileCode2}
            title="Lines of Code"
            value={metrics.codeLines ?? metrics.linesOfCode ?? 0}
            description={
              metrics.blankLines > 0
                ? `${metrics.blankLines} blank lines excluded`
                : "Non-empty source lines"
            }
          />

          <MetricCard
            icon={Braces}
            title="Complexity"
            value={metrics.complexity || 1}
            description="Estimated cyclomatic complexity"
          />

          <MetricCard
            icon={Bug}
            title="Unique Issues"
            value={uniqueIssueCount}
            description={`${rawDetectionCount} raw detections · ${mergedDetectionCount} duplicates merged`}
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <CategoryScoreCard
            icon={Shield}
            title="Security"
            score={categoryScores.Security}
          />

          <CategoryScoreCard
            icon={Code2}
            title="Code Quality"
            score={categoryScores["Code Quality"]}
          />

          <CategoryScoreCard
            icon={Braces}
            title="Complexity"
            score={categoryScores.Complexity}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Static Analyzer
            </p>

            <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
              {metrics.staticIssueCount || 0} detections
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">CThru AI</p>

            <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
              {metrics.aiIssueCount || 0} detections
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Final Analysis
            </p>

            <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
              {uniqueIssueCount} unique issues
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Findings
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Unique issues detected after static and AI analysis were
            consolidated.
          </p>

          {findings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-10 text-center dark:border-green-500/20 dark:bg-green-500/10">
              <CheckCircle2
                size={42}
                className="mx-auto text-green-600 dark:text-green-400"
              />

              <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
                No issues detected
              </h3>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {findings.map((finding) => {
                const affectedLines = formatAffectedLines(finding.lineNumbers);

                return (
                  <div
                    key={finding.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                          severityStyles[finding.severity]
                        }`}
                      >
                        {finding.severity}
                      </span>

                      <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {finding.category}
                      </span>

                      {finding.occurrenceCount > 1 && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          <CopyCheck size={13} />
                          {finding.occurrenceCount} occurrences
                        </span>
                      )}

                      {affectedLines && (
                        <span className="text-xs text-zinc-400">
                          {affectedLines}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
                      {finding.issue}
                    </h3>

                    <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
                      {finding.explanation}
                    </p>

                    {finding.suggestedFix && (
                      <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Suggested Fix
                        </p>

                        <p className="mt-2 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
                          {finding.suggestedFix}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {correctionOpen && correction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <WandSparkles size={20} className="text-indigo-500" />

                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                    Auto Correct Result
                  </h2>
                </div>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Review the corrected source before retesting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCorrectionOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              <pre className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-sm leading-6 text-zinc-100 dark:border-zinc-800">
                <code>{correction.correctedCode}</code>
              </pre>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 px-6 py-5 dark:border-zinc-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCopyCorrectedCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {copied ? <Check size={16} /> : <Clipboard size={16} />}

                {copied ? "Copied" : "Copy Code"}
              </button>

              <button
                type="button"
                onClick={handleEditCorrectedCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Pencil size={16} />
                Edit Corrected Code
              </button>

              <button
                type="button"
                onClick={handleRetestCorrectedCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                <RefreshCw size={16} />
                Retest Corrected Code
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
