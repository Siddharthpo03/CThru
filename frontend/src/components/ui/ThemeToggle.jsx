import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        flex h-10 w-10 items-center justify-center
        rounded-xl
        border border-zinc-200
        bg-white
        text-zinc-700
        shadow-sm
        hover:bg-zinc-100
        dark:border-zinc-800
        dark:bg-zinc-900
        dark:text-zinc-300
        dark:hover:bg-zinc-800
      "
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
