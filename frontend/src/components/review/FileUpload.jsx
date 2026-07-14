import { useRef, useState } from "react";

import { CheckCircle2, FileCode2, UploadCloud, X } from "lucide-react";

const allowedExtensions = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "cc",
  "cxx",
];

export default function FileUpload({
  selectedFile,
  onFileSelect,
  onRemoveFile,
}) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const processFile = (file) => {
    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported source file type.");
      return;
    }

    setError("");
    onFileSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file = event.dataTransfer.files[0];

    processFile(file);
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2 size={20} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveFile}
            className="rounded-lg p-2 text-zinc-500 hover:bg-green-100 hover:text-zinc-900 dark:hover:bg-green-500/10 dark:hover:text-white"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-zinc-800/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cc,.cxx"
          onChange={(event) => processFile(event.target.files[0])}
          className="hidden"
        />

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {dragging ? <FileCode2 size={24} /> : <UploadCloud size={24} />}
        </div>

        <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
          {dragging ? "Drop your file here" : "Upload source code"}
        </p>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Drag and drop or click to browse
        </p>

        <p className="mt-4 text-xs text-zinc-400">
          JS, TS, Python, Java, C and C++
        </p>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
