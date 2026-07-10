const languages = ["JavaScript", "TypeScript", "Python", "Java", "C", "C++"];

export default function LanguageSelector({ language, setLanguage }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        Programming Language
      </label>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 outline-none focus:border-indigo-500"
      >
        {languages.map((lang) => (
          <option key={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );
}
