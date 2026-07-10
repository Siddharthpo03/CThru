import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, code, setCode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <Editor
        height="500px"
        language={language.toLowerCase()}
        value={code}
        onChange={(value) => setCode(value)}
        theme="vs-dark"
      />
    </div>
  );
}
