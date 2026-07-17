import {
  Bug,
  CheckCircle2,
  FileCode2,
  Plus,
  ShieldAlert,
  Sparkles,
  Search,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import QuickActions from "../components/dashboard/QuickActions";
import RecentReviews from "../components/dashboard/RecentReviews";
import StatsCard from "../components/dashboard/StatsCard";

import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(" ")[0] || "Developer";

  // Search & Filter state layers
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch data payload at layout instantiation
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await apiRequest("/reviews");
        // Expecting data pattern: { reviews: [...] }
        const reviewList = data.reviews || [];
        setReviews(reviewList);
        setFilteredReviews(reviewList);
      } catch (error) {
        toast.error("Failed to load reviews context: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // 2. High-Performance Instant Filter Engine
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredReviews(reviews);
      return;
    }

    const filtered = reviews.filter((review) => {
      const matchTitle = review.title?.toLowerCase().includes(query);
      const matchLanguage = review.language?.toLowerCase().includes(query);

      // Deep scan target structures for findings matches safely
      const matchFindings = review.findings?.some(
        (finding) =>
          finding.issue?.toLowerCase().includes(query) ||
          finding.explanation?.toLowerCase().includes(query) ||
          finding.category?.toLowerCase().includes(query),
      );

      return matchTitle || matchLanguage || matchFindings;
    });

    setFilteredReviews(filtered);
  }, [searchQuery, reviews]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Overview
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Here's what's happening with your code reviews.
            </p>
          </div>

          <Link
            to="/review"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-50"
          >
            <Plus size={18} />
            New Review
          </Link>
        </div>

        {/* Stats Section Wrapper Component */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Reviews"
            value={String(reviews.length || 18)}
            subtitle="Live balance track"
            icon={FileCode2}
            tone="indigo"
          />
          <StatsCard
            title="Passed Reviews"
            value="14"
            subtitle="78% success rate"
            icon={CheckCircle2}
            tone="green"
          />
          <StatsCard
            title="Issues Found"
            value="37"
            subtitle="12 resolved"
            icon={Bug}
            tone="red"
          />
          <StatsCard
            title="Security Warnings"
            value="4"
            subtitle="2 high priority"
            icon={ShieldAlert}
            tone="amber"
          />
        </div>

        {/* INSTANT SEARCH INTERFACE BAR */}
        <div className="mt-8 relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code reviews instantly by title, language, or specific issue findings..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:bg-zinc-950"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <QuickActions />

          <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-500/20">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={21} />
              </div>
              <h2 className="mt-5 text-xl font-semibold">AI Code Review</h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100">
                Find bugs, code smells, and performance issues with AI-powered
                analysis.
              </p>
              <Link
                to="/review"
                className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Analyze code
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT REVIEWS VIEWPORT (Fed with filtered data stream) */}
        <div className="mt-6">
          <RecentReviews reviews={filteredReviews} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
