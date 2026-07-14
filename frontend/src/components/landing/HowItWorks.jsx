import { SearchCheck, Sparkles, Upload } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Submit your code",
    description:
      "Paste source code directly into the editor or upload a supported source file.",
  },
  {
    number: "02",
    icon: SearchCheck,
    title: "CThru analyzes it",
    description:
      "Static analysis and AI inspect bugs, complexity, security, and code quality.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Review and improve",
    description:
      "Explore detailed findings, understand each issue, and apply suggested fixes.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Workflow
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            From code to clarity in three steps
          </h2>

          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400">
            Submit your code and receive structured, actionable feedback.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="absolute right-6 top-4 text-7xl font-bold text-zinc-100 dark:text-zinc-800">
                  {step.number}
                </span>

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    <Icon size={26} />
                  </div>

                  <h3 className="mt-7 text-xl font-semibold text-zinc-950 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
