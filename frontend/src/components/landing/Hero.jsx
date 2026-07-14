import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10" />

      <div className="mx-auto grid min-h-[85vh] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Sparkles size={16} />
            AI-Powered Code Review
          </div>

          <h1 className="mt-7 text-5xl font-bold leading-[1.1] tracking-tight text-zinc-950 sm:text-6xl dark:text-white">
            See through your code.
            <span className="block text-indigo-600">Build it better.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Detect bugs, security risks, performance issues, and code smells
            with intelligent AI-powered analysis.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/review"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
            >
              Start Reviewing
              <ArrowRight size={18} />
            </Link>

            <a
              href="#how"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              AI analysis
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Static analysis
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Multi-language
            </span>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30">
            <div className="flex h-12 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="h-3 w-3 rounded-full bg-green-500" />

              <span className="ml-4 text-xs text-zinc-500">app.js</span>
            </div>

            <div className="bg-zinc-950 p-7 font-mono text-sm leading-7 text-zinc-300">
              <p>
                <span className="text-purple-400">function</span>{" "}
                <span className="text-blue-400">calculateTotal</span>
                (items) {"{"}
              </p>

              <p className="pl-6">
                <span className="text-purple-400">let</span> total ={" "}
                <span className="text-orange-300">0</span>;
              </p>

              <p className="pl-6">
                <span className="text-purple-400">for</span> (i ={" "}
                <span className="text-orange-300">0</span>; i {"<"}{" "}
                items.length; i++) {"{"}
              </p>

              <p className="pl-12">total += items[i].price;</p>

              <p className="pl-6">{"}"}</p>

              <p className="pl-6">
                <span className="text-purple-400">return</span> total;
              </p>

              <p>{"}"}</p>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Potential global variable
                  </p>

                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Declare "i" using let to avoid polluting the global scope.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
