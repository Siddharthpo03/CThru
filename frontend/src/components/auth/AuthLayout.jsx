import { CheckCircle2, Code2, Sparkles } from "lucide-react";

import { Link } from "react-router-dom";

import ThemeToggle from "../ui/ThemeToggle";

const benefits = [
  "AI-powered code reviews",
  "Static code analysis",
  "Security and complexity insights",
];

export default function AuthLayout({ children, title, description }) {
  return (
    <div className="grid min-h-screen bg-white dark:bg-zinc-950 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-indigo-600 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-purple-500/30 blur-3xl" />

        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
              <Code2 size={23} />
            </div>

            <span className="text-2xl font-bold tracking-tight text-white">
              CThru
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl px-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Sparkles size={27} />
          </div>

          <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-white">
            See through your code.
            <span className="block text-indigo-200">
              Build with confidence.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-indigo-100">
            Find bugs, security risks, and performance issues before they become
            real problems.
          </p>

          <div className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 text-indigo-50"
              >
                <CheckCircle2 size={19} />

                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-12 text-sm text-indigo-200">
          © 2026 CThru. See through your code.
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 lg:hidden"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Code2 size={20} />
            </div>

            <span className="text-2xl font-bold text-zinc-950 dark:text-white">
              CThru
            </span>
          </Link>

          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            CThru
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-3 text-zinc-500 dark:text-zinc-400">{description}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
