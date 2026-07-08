import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-7xl items-center justify-between px-6">
      <div className="max-w-xl">
        <span className="rounded-full bg-indigo-600/20 px-4 py-2 text-indigo-400">
          AI Code Review Assistant
        </span>

        <h1 className="mt-6 text-6xl font-bold leading-tight">
          See Through
          <span className="text-indigo-500"> Your Code.</span>
        </h1>

        <p className="mt-6 text-lg text-zinc-400">
          Detect bugs, improve performance, uncover security issues, and receive
          AI-powered suggestions in seconds.
        </p>

        <div className="mt-8 flex gap-4">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 hover:bg-indigo-500">
            Start Reviewing
            <ArrowRight size={18} />
          </button>

          <button className="rounded-lg border border-zinc-700 px-6 py-3 hover:border-indigo-500">
            Learn More
          </button>
        </div>
      </div>

      <div className="hidden w-[500px] rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl lg:block">
        <pre className="text-sm text-green-400">
          {`function add(a,b){
return a+b
}

console.log(add(5,10))
`}
        </pre>
      </div>
    </section>
  );
}
