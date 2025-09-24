import Link from "next/link";

const features = [
  {
    title: "Config-driven",
    body: "A single JSON document defines steps, sections, branching rules, validation, and progress. Nothing is hardcoded in the UI.",
  },
  {
    title: "Adaptive branching",
    body: "Per-step show_if conditions are evaluated against the live answer set. The path adapts as the respondent moves through the flow.",
  },
  {
    title: "Resumable sessions",
    body: "Session state is persisted server-side. Refresh the browser, switch devices, or come back later \u2014 the engine drops you back at the right step.",
  },
  {
    title: "Clean export",
    body: "Flat JSON export of every answer plus session metadata. The same plumbing extends to SPSS or CSV without touching the engine.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16 sm:py-24">
      <header className="space-y-6">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          Demo &middot; Adaptive Workflow Engine
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Config-driven multi-step flows
          <br />
          <span className="text-zinc-500">with resumable sessions.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          A small, deployable reference architecture for behavioural research
          instruments. FastAPI engine + Next.js renderer. The instrument is
          authored as JSON. The engine evaluates branching, persists sessions,
          and exports flat results.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/workflow"
            className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          >
            Start the demo
          </Link>
          <a
            href="https://github.com"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
          >
            View source
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-base font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {f.body}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Architecture</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100">
{`backend/app/
  engine/      # pure step-resolution + branching + validation
  storage/     # SQLAlchemy models + repository
  routes/      # FastAPI endpoints
  config/      # study JSON + loader
  schemas/     # Pydantic wire schemas
frontend/src/
  api/         # typed fetch client
  engine/      # shared workflow types
  components/  # question renderers + chrome
  app/         # Next.js routes`}
        </pre>
      </section>
    </main>
  );
}
