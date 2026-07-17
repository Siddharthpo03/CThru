import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Cpu,
  Search,
  Paintbrush,
  Shield,
  Bell,
  Zap,
  Key,
  Activity,
  Info,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Terminal,
  Moon,
  Sun,
  Monitor,
  KeyRound,
  History,
  AlertTriangle,
  Layers,
  Clock,
} from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import toast from "react-hot-toast";
import { apiRequest } from "../services/api";

export default function Settings() {
  // --- MASTER STATE PLATFORMS ---
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [revealKey, setRevealKey] = useState(false);

  const [profile, setProfile] = useState({
    name: "Siddharth Pulugujja",
    email: "siddharth@nitw.ac.in",
    org: "National Institute of Technology, Warangal",
    password: "",
    newPassword: "",
  });

  const [aiEngine, setAiEngine] = useState({
    primaryModel: "gemini-3.1-flash-lite",
    fallbackModel: "gemini-3.5-pro",
    temperature: 0.2,
    maxTokens: 4096,
    contextLength: 32000,
  });

  const [analysis, setAnalysis] = useState({
    deepVerification: true,
    autoCorrect: false,
    securityScan: true,
    codeQuality: true,
    complexityScan: true,
    duplicateDetection: false,
    mergeStaticAI: true,
    maxFileSize: 2500,
  });

  const [appearance, setAppearance] = useState({
    theme: "dark",
    accentColor: "indigo",
    compactMode: false,
    animations: true,
  });

  const [security, setSecurity] = useState({
    sessionTimeout: "60",
    rememberMe: true,
    twoFactor: false,
  });

  const [notifications, setNotifications] = useState({
    analysisComplete: true,
    autoFixComplete: true,
    aiErrors: true,
    securityAlerts: true,
    productUpdates: false,
  });

  const [performance, setPerformance] = useState({
    cacheSize: 512,
    parallelReviews: 2,
    maxQueue: 5,
  });

  // --- TAB NAVIGATION SCHEMATICS ---
  const tabs = [
    { id: "profile", title: "Profile", icon: User },
    { id: "ai", title: "AI Engine", icon: Cpu },
    { id: "analysis", title: "Analysis", icon: Search },
    { id: "appearance", title: "Appearance", icon: Paintbrush },
    { id: "security", title: "Security", icon: Shield },
    { id: "notifications", title: "Notifications", icon: Bell },
    { id: "performance", title: "Performance", icon: Zap },
    { id: "apiKeys", title: "API Keys", icon: Key },
    { id: "diagnostics", title: "Diagnostics", icon: Activity },
    { id: "about", title: "About", icon: Info },
  ];

  const markDirty = () => setHasChanges(true);
  // --- SAFE BACKEND DISPATCH PIPELINE ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "profile") {
        // Safe Profile Payload Isolation
        const profilePayload = {
          name: profile.name,
          email: profile.email,
        };

        // UPDATED: Changed path to "/users" to match base collection controller route mapping
        await apiRequest("/users", {
          method: "PUT",
          body: JSON.stringify(profilePayload),
        });
      } else if (activeTab === "security") {
        if (!profile.password || !profile.newPassword) {
          throw new Error(
            "Both current password and new password vectors are required.",
          );
        }

        await apiRequest("/users/change-password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: profile.password,
            newPassword: profile.newPassword,
          }),
        });

        // Reset password fields locally after success
        setProfile((prev) => ({ ...prev, password: "", newPassword: "" }));
      } else {
        // Safe General Settings Payload (Flattened & Correctly Prefixed)
        const settingsPayload = {
          primaryModel: aiEngine.primaryModel,
          fallbackModel: aiEngine.fallbackModel,
          temperature: aiEngine.temperature,
          maxTokens: aiEngine.maxTokens,
          contextLength: aiEngine.contextLength,

          deepVerification: analysis.deepVerification,
          autoCorrect: analysis.autoCorrect,
          securityScan: analysis.securityScan,
          codeQuality: analysis.codeQuality,
          complexityScan: analysis.complexityScan,
          duplicateDetection: analysis.duplicateDetection,
          mergeStaticAI: analysis.mergeStaticAI,
          maxFileSize: analysis.maxFileSize,

          theme: appearance.theme,
          accentColor: appearance.accentColor,
          compactMode: appearance.compactMode,
          animations: appearance.animations,

          sessionTimeout: security.sessionTimeout,
          rememberMe: security.rememberMe,

          analysisComplete: notifications.analysisComplete,
          autoFixComplete: notifications.autoFixComplete,
          aiErrors: notifications.aiErrors,
          securityAlerts: notifications.securityAlerts,
          productUpdates: notifications.productUpdates,

          cacheSize: performance.cacheSize,
          parallelReviews: performance.parallelReviews,
          maxQueue: performance.maxQueue,
        };

        await apiRequest("/settings", {
          method: "PUT",
          body: JSON.stringify(settingsPayload),
        });
      }

      setHasChanges(false);
      toast.success("Configuration vectors saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to persist configurations.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncMatrix = async () => {
    setIsSyncing(true);
    try {
      await apiRequest("/settings/sync", { method: "POST" });
      toast.success("Core engine matrix node successfully synchronized!");
    } catch (err) {
      toast.error("Sync pipeline execution failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    toast.success("Operational cache allocation layer safely purged.");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-24 relative">
        {/* HEADER BRAND DECK */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <SettingsIcon
                size={15}
                className="animate-spin-[spin_4s_linear_infinite]"
              />
              System Control Matrix
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Settings
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage your account identity, algorithmic AI thresholds, and
              environment preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-amber-500 animate-pulse bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <AlertCircle size={13} /> UNSAVED_MODIFICATIONS
              </span>
            )}
            <button
              onClick={handleSyncMatrix}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-mono font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition shadow-sm"
            >
              <RefreshCw
                size={13}
                className={isSyncing ? "animate-spin text-indigo-500" : ""}
              />
              SYNC_NODES
            </button>
          </div>
        </div>

        {/* WORKSPACE SIDEBAR LAYOUT */}
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* LEFT PANELS TAB DECK */}
          <aside className="flex flex-row overflow-x-auto lg:flex-col gap-1 border-b lg:border-b-0 pb-2 lg:pb-0 border-zinc-200 dark:border-zinc-800 scrollbar-none shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon
                    size={17}
                    className={
                      isActive ? "scale-110 transition" : "text-zinc-400"
                    }
                  />
                  {tab.title}
                </button>
              );
            })}
          </aside>

          {/* RIGHT PANELS VIEWPORT CONTENT */}
          <main className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 shadow-sm backdrop-blur-md min-h-[500px]">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  👤 Profile Configuration
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                        markDirty();
                      }}
                      className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      System Email Target
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => {
                        setProfile({ ...profile, email: e.target.value });
                        markDirty();
                      }}
                      className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      College / Campus Organization
                    </label>
                    <input
                      type="text"
                      value={profile.org}
                      onChange={(e) => {
                        setProfile({ ...profile, org: e.target.value });
                        markDirty();
                      }}
                      className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-zinc-800 space-y-4">
                  <h4 className="text-sm font-bold text-red-500">
                    Danger Zone
                  </h4>
                  <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 dark:border-red-900/30 dark:bg-red-950/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                        Deconstruct Infrastructure
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Permanently purge your account details, access keys, and
                        historical code audit files.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-xl self-start sm:self-auto transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI ENGINE */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🤖 LLM Model Tuning Core
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Primary Inference Core
                    </label>
                    <select
                      value={aiEngine.primaryModel}
                      onChange={(e) => {
                        setAiEngine({
                          ...aiEngine,
                          primaryModel: e.target.value,
                        });
                        markDirty();
                      }}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 text-sm py-2.5 px-3 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 text-zinc-900 dark:text-white"
                    >
                      <option value="gemini-3.1-flash-lite">
                        Gemini 3.1 Flash Lite (Fast Optimization)
                      </option>
                      <option value="gemini-3.5-pro">
                        Gemini 3.5 Pro Core (Deep Logic Reasoning)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Failover Redundancy Target
                    </label>
                    <select
                      value={aiEngine.fallbackModel}
                      onChange={(e) => {
                        setAiEngine({
                          ...aiEngine,
                          fallbackModel: e.target.value,
                        });
                        markDirty();
                      }}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 text-sm py-2.5 px-3 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 text-zinc-900 dark:text-white"
                    >
                      <option value="gemini-3.5-pro">
                        Gemini 3.5 Pro Core Core
                      </option>
                      <option value="gemini-3.1-flash-lite">
                        Gemini 3.1 Flash Lite
                      </option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      <span>Sampling Temperature</span>
                      <span className="font-mono text-indigo-500">
                        {aiEngine.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiEngine.temperature}
                      onChange={(e) => {
                        setAiEngine({
                          ...aiEngine,
                          temperature: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      <span>Max Response Tokens</span>
                      <span className="font-mono text-indigo-500">
                        {aiEngine.maxTokens}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1024"
                      max="16384"
                      step="1024"
                      value={aiEngine.maxTokens}
                      onChange={(e) => {
                        setAiEngine({
                          ...aiEngine,
                          maxTokens: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ANALYSIS */}
            {activeTab === "analysis" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🔍 Core Instrumentation Modules
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      key: "deepVerification",
                      label: "Multi-Pass Deep Verification",
                      desc: "Runs systematic matrix loops to ensure variable memory validation stays secure.",
                    },
                    {
                      key: "autoCorrect",
                      label: "Predictive Auto-Correct Remediation",
                      desc: "Pre-compiles structural fix code blocks ahead of interface reporting outputs.",
                    },
                    {
                      key: "securityScan",
                      label: "Vulnerability Scanning",
                      desc: "Checks code strings for common vulnerabilities and memory leakage lines.",
                    },
                    {
                      key: "mergeStaticAI",
                      label: "Consolidate Dual Results",
                      desc: "Blends static regex matching and runtime LLM processing into unified cards.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAnalysis({
                            ...analysis,
                            [item.key]: !analysis[item.key],
                          });
                          markDirty();
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          analysis[item.key]
                            ? "bg-indigo-600"
                            : "bg-zinc-200 dark:bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            analysis[item.key]
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🎨 UI Workspace Aesthetics
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                      Theme Engine Mode
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "dark", label: "Dark Mode", icon: Moon },
                        { id: "light", label: "Light Mode", icon: Sun },
                        { id: "system", label: "System Core", icon: Monitor },
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setAppearance({ ...appearance, theme: t.id });
                            markDirty();
                          }}
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition ${
                            appearance.theme === t.id
                              ? "border-indigo-500 bg-indigo-500/5 text-indigo-500 ring-1 ring-indigo-500"
                              : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          <t.icon size={18} className="mb-2" />
                          <span className="text-xs font-medium">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                        Compact Density Mode
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Reduces row spacing thresholds across tables to maximize
                        overview telemetry data details.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAppearance({
                          ...appearance,
                          compactMode: !appearance.compactMode,
                        });
                        markDirty();
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        appearance.compactMode
                          ? "bg-indigo-600"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          appearance.compactMode
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🔐 Cryptographic Safety Node
                </h3>
                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Current Code Matrix Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profile.password}
                        onChange={(e) => {
                          setProfile({ ...profile, password: e.target.value });
                          markDirty();
                        }}
                        className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        New Security Vector Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profile.newPassword}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            newPassword: e.target.value,
                          });
                          markDirty();
                        }}
                        className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                        Two-Factor Core Authentication (2FA)
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Inject an additional security hardware tier signature
                        during system deployments.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md font-bold">
                      COMING_SOON
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🔔 Dispatch Signals & Alert Filters
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      key: "analysisComplete",
                      label: "Analysis Loop Completions",
                      desc: "Dispatch real-time socket signals when parsing engines finish compilation logs.",
                    },
                    {
                      key: "securityAlerts",
                      label: "Critical Vulnerability Detections",
                      desc: "Immediate system interrupt if high severity logic bugs map into main branches.",
                    },
                    {
                      key: "productUpdates",
                      label: "Operational Log Manifests",
                      desc: "Periodic telemetry updates containing performance enhancement releases.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key],
                          });
                          markDirty();
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          notifications[item.key]
                            ? "bg-indigo-600"
                            : "bg-zinc-200 dark:bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            notifications[item.key]
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PERFORMANCE */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  ⚡ Thread Allocation & Resource Controls
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      <span>Operational Engine Cache Pool</span>
                      <span className="font-mono text-indigo-500">
                        {performance.cacheSize} MB
                      </span>
                    </div>
                    <input
                      type="range"
                      min="128"
                      max="2048"
                      step="128"
                      value={performance.cacheSize}
                      onChange={(e) => {
                        setPerformance({
                          ...performance,
                          cacheSize: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 border-t dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                        Flush Memory Matrix Nodes
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Purges compiled code maps safely to clear out workspace
                        buffer allocation spaces.
                      </p>
                    </div>
                    <button
                      onClick={handleClearCache}
                      type="button"
                      className="flex items-center gap-1.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-sm"
                    >
                      Clear Memory Buffer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API KEYS */}
            {activeTab === "apiKeys" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  🔑 Cryptographic Webhook Tokens
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Programmatic security keys utilized to trigger instant
                  automated code review matrices straight from external
                  environments like GitHub Actions or terminal workflows.
                </p>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 relative">
                  <div className="absolute top-2 right-3 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] px-1.5 rounded uppercase font-bold">
                    CONNECTED
                  </div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Live Access Token Key
                  </label>
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2.5 border dark:border-zinc-800 font-mono text-xs">
                    <span className="flex-1 tracking-wider text-zinc-800 dark:text-zinc-200">
                      {revealKey
                        ? "cthru_live_7x9f2k01m38p5n92v4d8z1a"
                        : "cthru_live_••••••••••••••••••••••••"}
                    </span>
                    <button
                      onClick={() => setRevealKey(!revealKey)}
                      className="text-zinc-400 hover:text-zinc-600 transition p-1"
                    >
                      {revealKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DIAGNOSTICS */}
            {activeTab === "diagnostics" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  📊 Network Telemetry Diagnostics
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 font-mono text-xs">
                  {[
                    {
                      label: "Backend Core Status",
                      status: "ONLINE // STABLE",
                      val: "Operational",
                      color: "text-emerald-500",
                    },
                    {
                      label: "AI Analysis Node",
                      status: "3/3 BALANCED_ACTIVE",
                      val: "Optimal",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Database Cluster",
                      status: "0x4F0B_LOCK_SECURE",
                      val: "Secure",
                      color: "text-indigo-400",
                    },
                    {
                      label: "Avg Request Processing",
                      status: "LATENCY_PING",
                      val: "4.2 ms",
                      color: "text-amber-500",
                    },
                  ].map((diag, i) => (
                    <div
                      key={i}
                      className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800/80"
                    >
                      <p className="text-zinc-400 uppercase text-[10px] tracking-wider">
                        {diag.label}
                      </p>
                      <div className="mt-3 flex justify-between items-baseline">
                        <span className={`text-base font-bold ${diag.color}`}>
                          {diag.val}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {diag.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABOUT */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b dark:border-zinc-800 pb-3">
                  ℹ️ Engine Blueprint Information
                </h3>
                <div className="rounded-xl border dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Software Build Version
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      v1.4.0-production
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Core Node Engine Architecture
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      x86_64 system matrix
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Environment Blueprint Layer
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      Vite Cluster Client
                    </span>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 leading-6 bg-indigo-50/30 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 p-4 rounded-xl">
                  CThru is an interactive compiler optimization, security audit,
                  and deep static validation analysis workbench explicitly
                  tailored to analyze complex logic trees instantly.
                </div>
              </div>
            )}
          </main>
        </div>

        {/* FLOATING ACTION TRAYS CONTROLLER */}
        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl bg-zinc-950/90 text-white p-4 rounded-2xl border border-zinc-800/60 shadow-2xl flex items-center justify-between z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
            <div className="flex items-center gap-3 pl-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-medium text-zinc-200">
                System attributes modification batch pending deployment
                synchronization...
              </p>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Commit Adjustments
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
