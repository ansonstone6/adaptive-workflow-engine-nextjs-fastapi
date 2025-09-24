"use client";

import type { AnswerValue, BaseStep, OptionDef } from "@/engine/types";

interface Props {
  step: BaseStep;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

function normalize(value: AnswerValue | undefined): Array<string | number> {
  if (Array.isArray(value)) return value as Array<string | number>;
  return [];
}

export function MultiChoice({ step, value, onChange }: Props) {
  const selected = new Set(normalize(value).map((v) => String(v)));
  const options = step.options ?? [];

  function toggle(opt: OptionDef) {
    const key = String(opt.value);
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const ordered = options
      .filter((o) => next.has(String(o.value)))
      .map((o) => o.value);
    onChange(ordered as AnswerValue);
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isOn = selected.has(String(opt.value));
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => toggle(opt)}
            className={[
              "w-full text-left rounded-xl border px-4 py-3 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
              isOn
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600",
            ].join(" ")}
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  "size-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                  isOn
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-zinc-400",
                ].join(" ")}
              >
                {isOn && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium">{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
