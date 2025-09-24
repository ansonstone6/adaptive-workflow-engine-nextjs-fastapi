"use client";

import { useState } from "react";
import type { BaseStep, StudyConfig } from "@/engine/types";

interface Props {
  config: StudyConfig | null;
  currentStep: BaseStep | null;
  answers: Record<string, unknown>;
}

type Tab = "step" | "study" | "answers";

export function ConfigPreview({ config, currentStep, answers }: Props) {
  const [tab, setTab] = useState<Tab>("step");

  const payload = (() => {
    if (tab === "step") return currentStep ?? { note: "no current step" };
    if (tab === "study") return config ?? { note: "no config loaded" };
    return answers;
  })();

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Config preview
          </p>
          <p className="text-sm font-semibold">
            {config?.title ?? "Loading\u2026"}
          </p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
          {(["step", "study", "answers"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "rounded-md px-2 py-1 capitalize transition-colors",
                tab === t
                  ? "bg-white shadow-sm dark:bg-zinc-700"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>
      <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[11px] leading-5 text-zinc-700 dark:text-zinc-300">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </aside>
  );
}
