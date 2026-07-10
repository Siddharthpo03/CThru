import { useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout";

import LanguageSelector from "../components/review/LanguageSelector";
import CodeEditor from "../components/review/CodeEditor";
import FileUpload from "../components/review/FileUpload";
import ReviewActions from "../components/review/ReviewActions";

export default function NewReview() {
  const [language, setLanguage] = useState("JavaScript");

  const [code, setCode] = useState(
    `function hello(){
console.log("Hello CThru");
}`,
  );

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold">New Review</h1>

      <p className="mt-2 text-zinc-400">
        Paste your code or upload a source file.
      </p>

      <div className="mt-8 space-y-6">
        <LanguageSelector language={language} setLanguage={setLanguage} />

        <CodeEditor language={language} code={code} setCode={setCode} />

        <FileUpload />

        <ReviewActions />
      </div>
    </DashboardLayout>
  );
}
