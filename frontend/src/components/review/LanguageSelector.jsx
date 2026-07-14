import { useEffect, useRef, useState } from "react";

import { Check, ChevronDown } from "lucide-react";

const languages = [
  {
    label: "JavaScript",
    value: "javascript",
    short: "JS",
  },
  {
    label: "TypeScript",
    value: "typescript",
    short: "TS",
  },
  {
    label: "Python",
    value: "python",
    short: "PY",
  },
  {
    label: "Java",
    value: "java",
    short: "JV",
  },
  {
    label: "C",
    value: "c",
    short: "C",
  },
  {
    label: "C++",
    value: "cpp",
    short: "C++",
  },
];

export default function LanguageSelector({ language, setLanguage }) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectedLanguage =
    languages.find((item) => item.value === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left shadow-sm transition dark:bg-zinc-900 ${
          open
            ? "border-indigo-500 ring-4 ring-indigo-500/10"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-50 px-1.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {selectedLanguage.short}
          </div>

          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {selectedLanguage.label}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full min-w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40">
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Select language
            </p>
          </div>

          {languages.map((item) => {
            const selected = item.value === language;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setLanguage(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                  selected
                    ? "bg-indigo-50 dark:bg-indigo-500/10"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-[10px] font-bold ${
                      selected
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {item.short}
                  </div>

                  <span
                    className={`text-sm ${
                      selected
                        ? "font-semibold text-indigo-700 dark:text-indigo-400"
                        : "font-medium text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {selected && (
                  <Check
                    size={17}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
