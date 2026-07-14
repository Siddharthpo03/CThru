import Editor from "@monaco-editor/react";

import { useTheme } from "../../contexts/ThemeContext";

export default function CodeEditor({ language, code, setCode }) {
  const { theme } = useTheme();

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <Editor
        height="560px"
        language={language}
        value={code}
        onChange={(value) => setCode(value || "")}
        theme={theme === "dark" ? "vs-dark" : "light"}
        options={{
          minimap: {
            enabled: true,
          },
          fontSize: 14,
          lineHeight: 24,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: {
            top: 16,
            bottom: 16,
          },
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
        }}
      />
    </div>
  );
}
