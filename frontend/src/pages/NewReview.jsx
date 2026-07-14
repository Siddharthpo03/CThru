import { useState } from "react";

import { Braces, Code2, FileSearch, ShieldCheck, Sparkles } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import CodeEditor from "../components/review/CodeEditor";
import FileUpload from "../components/review/FileUpload";
import LanguageSelector from "../components/review/LanguageSelector";
import ReviewActions from "../components/review/ReviewActions";

import { apiRequest } from "../services/api";

const extensionLanguages = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
};

const starterCode = `function calculateTotal(items) {
  let total = 0;

  for (i = 0; i < items.length; i++) {
    total += items[i].price;
  }

  return total;
}`;

const analysisOptions = [
  {
    icon: FileSearch,
    title: "Code Quality",
    description: "Bugs and code smells",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    description: "Security vulnerabilities",
  },
  {
    icon: Braces,
    title: "Complexity",
    description: "Complexity metrics",
  },
];

export default function NewReview() {
  const navigate = useNavigate();
  const location = useLocation();

  const editData = location.state;

  const [language, setLanguage] = useState(editData?.language || "javascript");

  const [code, setCode] = useState(editData?.code || starterCode);

  const [selectedFile, setSelectedFile] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);

  const [selectedAnalysis, setSelectedAnalysis] = useState(
    editData?.selectedAnalysis || ["Code Quality", "Security", "Complexity"],
  );

  const handleFileSelect = (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    const detectedLanguage = extensionLanguages[extension];

    if (detectedLanguage) {
      setLanguage(detectedLanguage);
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      setCode(event.target.result || "");

      setSelectedFile(file);
    };

    reader.onerror = () => {
      toast.error("Unable to read source file.");
    };

    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const toggleAnalysis = (title) => {
    setSelectedAnalysis((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  };

  const handleAnalyze = async () => {
    if (!code.trim() || selectedAnalysis.length === 0) {
      return;
    }

    try {
      setAnalyzing(true);

      const title = selectedFile ? selectedFile.name : `${language} Review`;

      const data = await apiRequest("/reviews", {
        method: "POST",

        body: JSON.stringify({
          title,
          language,
          code,
          fileName: selectedFile?.name || null,
          selectedAnalysis,
        }),
      });

      toast.success("Code analysis completed.");

      navigate(`/reviews/${data.review.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Code Analysis
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              New Review
            </h1>

            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Paste your code or upload a source file to start a code review.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Code2 size={17} className="text-indigo-500" />
            {code.split("\n").length} lines
          </div>
        </div>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-visible rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative z-30 flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Code2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Code Editor
                  </p>

                  <p className="text-xs text-zinc-500">
                    {selectedFile ? selectedFile.name : "Untitled source"}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-56">
                <LanguageSelector
                  language={language}
                  setLanguage={setLanguage}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-b-2xl">
              <CodeEditor language={language} code={code} setCode={setCode} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Source File
              </h2>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Upload a file to load it into the editor.
              </p>

              <div className="mt-5">
                <FileUpload
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />

                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Analysis
                </h2>
              </div>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Select the checks you want CThru to perform.
              </p>

              <div className="mt-5 space-y-3">
                {analysisOptions.map((option) => {
                  const Icon = option.icon;

                  const selected = selectedAnalysis.includes(option.title);

                  return (
                    <button
                      key={option.title}
                      type="button"
                      onClick={() => toggleAnalysis(option.title)}
                      className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-indigo-300 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-500/10"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                            selected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:text-white"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div>
                          <p
                            className={`text-sm font-medium ${
                              selected
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-zinc-900 dark:text-white"
                            }`}
                          >
                            {option.title}
                          </p>

                          <p className="mt-0.5 text-xs text-zinc-500">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                      >
                        {selected && (
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              d="M4 10.5L8 14L16 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAnalysis.length === 0 && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                  Select at least one analysis option.
                </p>
              )}

              <div className="mt-5">
                <ReviewActions
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                  disabled={!code.trim() || selectedAnalysis.length === 0}
                />
              </div>

              <p className="mt-3 text-center text-xs text-zinc-400">
                Your review will be saved to CThru automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
