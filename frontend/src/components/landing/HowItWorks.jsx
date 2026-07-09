import { Upload, SearchCheck, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Submit Code",
    description: "Paste your code or upload a source file in seconds.",
  },
  {
    icon: SearchCheck,
    title: "2. Analyze",
    description: "Static analysis detects bugs, code smells, and style issues.",
  },
  {
    icon: Sparkles,
    title: "3. Improve",
    description:
      "AI generates explanations, optimizations, and refactoring suggestions.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-zinc-900/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold">How CThru Works</h2>

        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-400">
          Three simple steps to make your code cleaner, safer, and easier to
          maintain.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center transition hover:border-indigo-500"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/20">
                  <Icon size={32} className="text-indigo-400" />
                </div>

                <h3 className="mb-3 text-2xl font-semibold">{step.title}</h3>

                <p className="text-zinc-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
