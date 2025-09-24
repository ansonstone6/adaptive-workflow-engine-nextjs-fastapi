"use client";

import type { AnswerValue, BaseStep } from "@/engine/types";

interface Props {
  step: BaseStep;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function Scale({ step, value, onChange }: Props) {
  const min = step.min ?? 1;
  const max = step.max ?? 7;
  const points: number[] = [];
  for (let i = min; i <= max; i += 1) points.push(i);
  const selected = typeof value === "number" ? value : null;

  return (
    <div className="space-y-3">
      <div className="flex items-stretch justify-between gap-2">
        {points.map((n) => {
          const isOn = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={[
                "flex-1 min-w-10 rounded-xl border py-3 text-sm font-semibold transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                isOn
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
              ].join(" ")}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(step.min_label || step.max_label) && (
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{step.min_label}</span>
          <span>{step.max_label}</span>
        </div>
      )}
    </div>
  );
}
