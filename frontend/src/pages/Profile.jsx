import React, { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Award,
  Calendar,
  Key,
  Save,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useAuth();

  // Local state form handling variables
  const [name, setName] = useState(user?.name || "Siddharth Pulugujja");
  const [email, setEmail] = useState(user?.email || "siddharth@nitw.ac.in");
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setUpdating(true);

    // Simulate API request context delay
    setTimeout(() => {
      setUpdating(false);
      toast.success("Profile updated successfully!");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Block Banner */}
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Account Profile
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your developer identity, security keys, and system
            preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          {/* Main Account Settings Form Box Container */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white mb-6 flex items-center gap-2">
              <User size={18} className="text-indigo-500" />
              Profile Details
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:bg-zinc-950"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:bg-zinc-950"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  <Save size={16} />
                  {updating ? "Saving Changes..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side Overview Stats Sidebar Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-xl uppercase shadow-inner">
                {name.substring(0, 2)}
              </div>
              <h3 className="mt-4 font-semibold text-zinc-950 dark:text-white truncate">
                {name}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                {email}
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                Verified Student
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Insights
              </h4>

              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Award size={16} className="text-amber-500" />
                <span>
                  Plan: <strong>Free Sandbox</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar size={16} className="text-zinc-400" />
                <span>
                  Joined: <strong>July 2026</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
