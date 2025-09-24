"use client";

import type { AnswerValue, BaseStep } from "@/engine/types";

interface Props {
  step: BaseStep;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function SingleChoice({ step, value, onChange }: Props) {
  const options = step.options ?? [];
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "w-full text-left rounded-xl border px-4 py-3 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
              selected
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
            ].join(" ")}
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  "size-4 rounded-full border-2 flex-shrink-0",
                  selected
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-zinc-400",
                ].join(" ")}
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
