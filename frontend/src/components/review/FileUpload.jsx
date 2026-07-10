import { UploadCloud } from "lucide-react";

export default function FileUpload() {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 p-10 transition hover:border-indigo-500">
      <UploadCloud size={40} className="text-indigo-400" />

      <h3 className="mt-4 text-lg font-semibold">Upload Source Code</h3>

      <p className="mt-2 text-zinc-400">Drag & Drop or Click</p>

      <input type="file" className="hidden" />
    </label>
  );
}
