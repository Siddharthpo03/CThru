import {
  Bug,
  CheckCircle2,
  FileCode2,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import QuickActions from "../components/dashboard/QuickActions";
import RecentReviews from "../components/dashboard/RecentReviews";
import StatsCard from "../components/dashboard/StatsCard";

import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const firstName = user?.name?.trim().split(" ")[0] || "Developer";

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
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            New Review
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Reviews"
            value="18"
            subtitle="5 reviews this week"
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

        <div className="mt-6">
          <RecentReviews />
        </div>
      </div>
    </DashboardLayout>
  );
}
