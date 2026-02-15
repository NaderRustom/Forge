import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 px-6 text-center">
        <div className="text-6xl">⚡</div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Forge
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Chat-first GTM workspace. Build lead lists, enrich data with AI,
          and automate your go-to-market workflows.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Get Started
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign Up
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: "💬",
              title: "Chat-First",
              desc: "Control everything through natural language. Create tables, import data, run enrichments.",
            },
            {
              icon: "🤖",
              title: "AI Columns",
              desc: "Add AI-powered columns that enrich every row — ICP scores, personalization, domain lookup.",
            },
            {
              icon: "⚙️",
              title: "Workflows",
              desc: "Chain steps into reusable workflows. One command runs your entire enrichment pipeline.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 text-2xl">{feature.icon}</div>
              <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
