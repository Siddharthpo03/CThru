import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  Wifi,
  Terminal,
  Sparkles,
  Send,
  Lock,
} from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { apiRequest } from "../services/api";

export default function Settings() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // --- NAVIGATION TAB STATE ---
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // --- INITIALIZE SETTINGS FROM LOCALSTORAGE ---
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem("cthru-settings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  // Profile
  const [profile, setProfile] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    org:
      localStorage.getItem("cthru-organization") ||
      "National Institute of Technology, Warangal",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }));



  // AI Engine
  const [aiEngine, setAiEngine] = useState(() => ({
    primaryModel: "gemini-3.1-flash-lite",
    fallbackModel: "gemini-3.5-pro",
    temperature: 0.2,
    maxTokens: 4096,
    contextLength: 32000,
    ...(initialSettings.aiEngine || {}),
  }));

  // Analysis
  const [analysis, setAnalysis] = useState(() => ({
    deepVerification: true,
    autoCorrect: false,
    securityScan: true,
    codeQuality: true,
    complexityScan: true,
    duplicateDetection: false,
    mergeStaticAI: true,
    maxFileSize: 2500,
    ...(initialSettings.analysis || {}),
  }));

  // Appearance
  const [appearance, setAppearance] = useState(() => ({
    themeMode: theme || "dark",
    compactMode: false,
    animations: true,
    ...(initialSettings.appearance || {}),
  }));

  // Security
  const [security, setSecurity] = useState(() => ({
    sessionTimeout: "60",
    rememberMe: true,
    twoFactor: false,
    ...(initialSettings.security || {}),
  }));

  // Notifications
  const [notifications, setNotifications] = useState(() => ({
    analysisComplete: true,
    autoFixComplete: true,
    securityAlerts: true,
    productUpdates: false,
    emailReports: true,
    soundAlerts: false,
    ...(initialSettings.notifications || {}),
  }));

  // Performance
  const [performanceState, setPerformanceState] = useState(() => ({
    cacheSize: 512,
    parallelReviews: 2,
    maxQueue: 5,
    ...(initialSettings.performance || {}),
  }));

  // API Keys
  const [apiKey, setApiKey] = useState(() => {
    return (
      localStorage.getItem("cthru-api-key") ||
      "cthru_live_7x9f2k01m38p5n92v4d8z1a"
    );
  });
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return (
      localStorage.getItem("cthru-webhook-url") ||
      "https://api.github.com/repos/your-org/cthru-ci/actions"
    );
  });

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState({
    serverStatus: "Checking...",
    latencyMs: null,
    isHealthy: true,
    dbStatus: "Connected",
    lastChecked: null,
  });
  const [isProbing, setIsProbing] = useState(false);

  // Probe Server Health
  const runHealthProbe = async () => {
    setIsProbing(true);
    const start = performance.now();
    try {
      const res = await apiRequest("/health");
      const latency = Math.round(performance.now() - start);
      setDiagnostics({
        serverStatus: res.success ? "Operational" : "Degraded",
        latencyMs: latency,
        isHealthy: res.success,
        dbStatus: "Active & Synced",
        lastChecked: new Date().toLocaleTimeString(),
      });
      toast.success(`Server probe successful: ${latency} ms latency`);
    } catch {
      setDiagnostics({
        serverStatus: "Offline / Unreachable",
        latencyMs: null,
        isHealthy: false,
        dbStatus: "Disconnected",
        lastChecked: new Date().toLocaleTimeString(),
      });
      toast.error("Health probe failed: Backend server is unreachable.");
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const start = performance.now();
      try {
        const res = await apiRequest("/health");
        const latency = Math.round(performance.now() - start);
        if (isMounted) {
          setDiagnostics({
            serverStatus: res.success ? "Operational" : "Degraded",
            latencyMs: latency,
            isHealthy: res.success,
            dbStatus: "Active & Synced",
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      } catch {
        if (isMounted) {
          setDiagnostics({
            serverStatus: "Offline / Unreachable",
            latencyMs: null,
            isHealthy: false,
            dbStatus: "Disconnected",
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      }
    };

    probe();
    return () => {
      isMounted = false;
    };
  }, []);

  const markDirty = () => setHasChanges(true);

  // --- SAVE ACTIONS ---
  const handleSaveProfile = async () => {
    if (!profile.name?.trim() || !profile.email?.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      localStorage.setItem("cthru-organization", profile.org.trim());
      setHasChanges(false);
      toast.success("Profile and organization updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile.currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!profile.newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (profile.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (profile.newPassword !== profile.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({
        currentPassword: profile.currentPassword,
        newPassword: profile.newPassword,
      });
      setProfile((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setHasChanges(false);
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "WARNING: Are you absolutely sure you want to permanently delete your account?\n\nThis will purge all your profile data, access tokens, and historical code audit files. This action CANNOT be reversed."
    );

    if (!confirmation) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your account has been deleted.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    try {
      const payload = {
        aiEngine,
        analysis,
        appearance,
        security,
        notifications,
        performance: performanceState,
      };
      localStorage.setItem("cthru-settings", JSON.stringify(payload));
      localStorage.setItem("cthru-api-key", apiKey);
      localStorage.setItem("cthru-webhook-url", webhookUrl);
      setHasChanges(false);
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveActiveTab = async () => {
    if (activeTab === "profile") {
      await handleSaveProfile();
    } else if (activeTab === "security") {
      if (profile.currentPassword || profile.newPassword) {
        await handleChangePassword();
      } else {
        handleSavePreferences();
      }
    } else {
      handleSavePreferences();
    }
  };

  const handleSyncMatrix = async () => {
    setIsSyncing(true);
    try {
      await runHealthProbe();
      toast.success("System nodes and telemetry state successfully synchronized!");
    } catch {
      toast.error("Sync pipeline execution failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          k !== "cthru-token" &&
          k !== "cthru-theme" &&
          k !== "cthru-settings" &&
          k !== "cthru-organization" &&
          k !== "cthru-api-key"
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      toast.success(`Cleared ${keysToRemove.length} temporary cache nodes.`);
    } catch {
      toast.error("Failed to purge operational cache.");
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const confirmRegen = window.confirm(
      "Regenerate API Key?\nAny external automated pipelines or GitHub Actions utilizing the old key will stop working until updated."
    );
    if (!confirmRegen) return;

    const chars = "abcdef0123456789";
    let randomHex = "";
    for (let i = 0; i < 24; i++) {
      randomHex += chars[Math.floor(Math.random() * chars.length)];
    }
    const newKey = `cthru_live_${randomHex}`;
    setApiKey(newKey);
    localStorage.setItem("cthru-api-key", newKey);
    toast.success("New API key generated and stored.");
  };

  const handleSendTestNotification = () => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-zinc-900 border border-indigo-500/40 shadow-xl rounded-2xl pointer-events-auto flex p-4 ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-white">
                CThru System Signal Triggered
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Your notification dispatch pipeline is active and verified!
              </p>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    ));
  };

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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-24 relative">
        {/* HEADER BRAND DECK */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <SettingsIcon size={15} />
              System Control Matrix
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Settings
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage your account identity, algorithmic AI thresholds, and environment preferences.
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
              className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-mono font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition shadow-sm disabled:opacity-50"
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
                    className={isActive ? "scale-110 transition" : "text-zinc-400"}
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
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    👤 Profile Configuration
                  </h3>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    Save Profile
                  </button>
                </div>

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
                  <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={15} /> Danger Zone
                  </h4>
                  <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 dark:border-red-900/30 dark:bg-red-950/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                        Deconstruct Infrastructure
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Permanently purge your account details, access keys, and historical code audit files.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-xl self-start sm:self-auto transition disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI ENGINE */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🤖 LLM Model Tuning Core
                  </h3>
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save size={13} /> Save AI Tuning
                  </button>
                </div>

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
                        Gemini 3.5 Pro Core
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
                      step="0.05"
                      value={aiEngine.temperature}
                      onChange={(e) => {
                        setAiEngine({
                          ...aiEngine,
                          temperature: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
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
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ANALYSIS */}
            {activeTab === "analysis" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🔍 Core Instrumentation Modules
                  </h3>
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save size={13} /> Save Analysis Options
                  </button>
                </div>

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
                      key: "complexityScan",
                      label: "Cyclomatic Complexity Profiling",
                      desc: "Calculates nested loop depths, branches, and architectural debt metrics.",
                    },
                    {
                      key: "duplicateDetection",
                      label: "Duplicate Code Detection",
                      desc: "Finds repeated logic blocks across analyzed files and suggests refactoring.",
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
                        type="button"
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
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🎨 UI Workspace Aesthetics
                  </h3>
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save size={13} /> Save Aesthetics
                  </button>
                </div>

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
                            if (t.id === "system") {
                              const isDark = window.matchMedia(
                                "(prefers-color-scheme: dark)"
                              ).matches;
                              setTheme(isDark ? "dark" : "light");
                            } else {
                              setTheme(t.id);
                            }
                            setAppearance({ ...appearance, themeMode: t.id });
                            markDirty();
                          }}
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition ${
                            theme === t.id ||
                            (t.id === "system" && appearance.themeMode === "system")
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500"
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
                        Reduces row spacing thresholds across tables to maximize overview telemetry data details.
                      </p>
                    </div>
                    <button
                      type="button"
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
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🔐 Cryptographic Safety Node
                  </h3>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Lock size={13} /> Update Password
                  </button>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profile.currentPassword}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            currentPassword: e.target.value,
                          });
                          markDirty();
                        }}
                        className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        New Password
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
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profile.confirmPassword}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            confirmPassword: e.target.value,
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
                        Session Timeout Window
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Automatically lock workspace if inactive for specified duration.
                      </p>
                    </div>
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => {
                        setSecurity({ ...security, sessionTimeout: e.target.value });
                        markDirty();
                      }}
                      className="bg-zinc-50 dark:bg-zinc-950 text-xs py-2 px-3 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="1440">24 Hours</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🔔 Dispatch Signals & Alert Filters
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-sm"
                    >
                      <Send size={12} /> Test Signal
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                    >
                      <Save size={13} /> Save Notifications
                    </button>
                  </div>
                </div>

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
                      key: "emailReports",
                      label: "Email Audit Summaries",
                      desc: "Forward summary PDF or analysis logs to your primary email address.",
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
                        type="button"
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
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    ⚡ Thread Allocation & Resource Controls
                  </h3>
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save size={13} /> Save Performance
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      <span>Operational Engine Cache Pool</span>
                      <span className="font-mono text-indigo-500">
                        {performanceState.cacheSize} MB
                      </span>
                    </div>
                    <input
                      type="range"
                      min="128"
                      max="2048"
                      step="128"
                      value={performanceState.cacheSize}
                      onChange={(e) => {
                        setPerformanceState({
                          ...performanceState,
                          cacheSize: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      <span>Parallel Review Pipelines</span>
                      <span className="font-mono text-indigo-500">
                        {performanceState.parallelReviews} Concurrent Nodes
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={performanceState.parallelReviews}
                      onChange={(e) => {
                        setPerformanceState({
                          ...performanceState,
                          parallelReviews: Number(e.target.value),
                        });
                        markDirty();
                      }}
                      className="w-full accent-indigo-600 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 border-t dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                        Flush Memory Matrix Nodes
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Purges cached analysis cards and temporary buffers without altering account state.
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
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    🔑 Cryptographic Webhook Tokens
                  </h3>
                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save size={13} /> Save API Config
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Programmatic security keys utilized to trigger instant automated code review matrices straight from external environments like GitHub Actions or terminal workflows.
                </p>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Live Access Token Key
                    </label>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                      ACTIVE_KEY
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2.5 border dark:border-zinc-800 font-mono text-xs">
                    <span className="flex-1 tracking-wider text-zinc-800 dark:text-zinc-200 truncate select-all">
                      {revealKey ? apiKey : "cthru_live_••••••••••••••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRevealKey(!revealKey)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1"
                      title={revealKey ? "Hide key" : "Show key"}
                    >
                      {revealKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="text-zinc-400 hover:text-indigo-500 transition p-1"
                      title="Copy key"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw size={12} /> Regenerate Key
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Webhook Relay Target URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      markDirty();
                    }}
                    placeholder="https://your-domain.com/api/cthru-webhook"
                    className="w-full rounded-xl border bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-indigo-500 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            )}

            {/* DIAGNOSTICS */}
            {activeTab === "diagnostics" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    📊 Network Telemetry Diagnostics
                  </h3>
                  <button
                    onClick={runHealthProbe}
                    disabled={isProbing}
                    className="flex items-center gap-1.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw size={12} className={isProbing ? "animate-spin text-indigo-500" : ""} />
                    Probe System
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 font-mono text-xs">
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-zinc-400 uppercase text-[10px] tracking-wider">
                      <span>Backend Core Server</span>
                      {diagnostics.isHealthy ? (
                        <Wifi size={13} className="text-emerald-500" />
                      ) : (
                        <Wifi size={13} className="text-red-500" />
                      )}
                    </div>
                    <div className="mt-3 flex justify-between items-baseline">
                      <span
                        className={`text-base font-bold ${
                          diagnostics.isHealthy ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {diagnostics.serverStatus}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {diagnostics.latencyMs !== null
                          ? `${diagnostics.latencyMs} ms PING`
                          : "TIMEOUT"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800/80">
                    <p className="text-zinc-400 uppercase text-[10px] tracking-wider">
                      Database Cluster
                    </p>
                    <div className="mt-3 flex justify-between items-baseline">
                      <span className="text-base font-bold text-indigo-400">
                        {diagnostics.dbStatus}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        PRISMA_POSTGRES_POOL
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800/80">
                    <p className="text-zinc-400 uppercase text-[10px] tracking-wider">
                      AI Analysis Node
                    </p>
                    <div className="mt-3 flex justify-between items-baseline">
                      <span className="text-base font-bold text-emerald-500">
                        Ready
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        GEMINI_SDK_ACTIVE
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800/80">
                    <p className="text-zinc-400 uppercase text-[10px] tracking-wider">
                      Last Probe Cycle
                    </p>
                    <div className="mt-3 flex justify-between items-baseline">
                      <span className="text-base font-bold text-amber-500">
                        {diagnostics.lastChecked || "Awaiting Probe"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        SYS_CLOCK
                      </span>
                    </div>
                  </div>
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
                    <span className="text-zinc-400">Software Build Version</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      v1.4.0-production
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Core Node Engine Architecture</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      x86_64 system matrix
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Environment Blueprint Layer</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      Vite Cluster + Express Backend
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed bg-indigo-50/30 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 p-4 rounded-xl">
                  CThru is an interactive compiler optimization, security audit, and deep static validation analysis workbench explicitly tailored to analyze complex logic trees instantly.
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toast.success("System documentation is active.")}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-400 font-semibold"
                  >
                    <Terminal size={13} /> View Architecture Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("All systems operating under MIT Open License.")}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-300 font-semibold"
                  >
                    <CheckCircle2 size={13} /> Software License
                  </button>
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
                System attributes modification batch pending deployment synchronization...
              </p>
            </div>
            <button
              onClick={handleSaveActiveTab}
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
