import {
  BarChart3,
  Brain,
  Bug,
  FileCode,
  ShieldCheck,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Code Review",
    description:
      "Receive intelligent suggestions to improve readability, maintainability, and code quality.",
  },
  {
    icon: Bug,
    title: "Bug Detection",
    description:
      "Identify logical errors and potential bugs before your code reaches production.",
  },
  {
    icon: ShieldCheck,
    title: "Security Analysis",
    description:
      "Discover common security risks and receive clear recommendations.",
  },
  {
    icon: FileCode,
    title: "Multi-language Support",
    description:
      "Analyze JavaScript, Python, Java, C++, and more from one workspace.",
  },
  {
    icon: Zap,
    title: "Performance Insights",
    description:
      "Find inefficient code and receive practical optimization suggestions.",
  },
  {
    icon: BarChart3,
    title: "Complexity Metrics",
    description:
      "Understand complexity, maintainability, and overall code health.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-y border-zinc-200 bg-zinc-50 py-24 dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Features
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Understand every line of code
          </h2>

          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400">
            CThru combines static analysis with AI to find issues and explain
            how to improve them.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-zinc-950 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
