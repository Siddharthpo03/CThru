import {
  Brain,
  Bug,
  ShieldCheck,
  FileCode,
  Zap,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Code Review",
    description:
      "Receive intelligent suggestions to improve readability, maintainability, and overall code quality.",
  },
  {
    icon: Bug,
    title: "Bug Detection",
    description:
      "Identify logical errors, potential bugs, and risky code before deployment.",
  },
  {
    icon: ShieldCheck,
    title: "Security Analysis",
    description:
      "Discover common security vulnerabilities and receive actionable recommendations.",
  },
  {
    icon: FileCode,
    title: "Multi-language Support",
    description:
      "Review JavaScript, Python, Java, C++, and more from one unified interface.",
  },
  {
    icon: Zap,
    title: "Performance Insights",
    description: "Find inefficient code and receive optimization suggestions.",
  },
  {
    icon: BarChart3,
    title: "Complexity Metrics",
    description:
      "Understand cyclomatic complexity, maintainability, and overall code health.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="text-center text-4xl font-bold">Powerful Features</h2>

      <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
        Everything you need to analyze, understand, and improve your source
        code.
      </p>

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition hover:-translate-y-2 hover:border-indigo-500"
            >
              <Icon className="mb-5 text-indigo-500" size={36} />

              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>

              <p className="text-zinc-400">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
