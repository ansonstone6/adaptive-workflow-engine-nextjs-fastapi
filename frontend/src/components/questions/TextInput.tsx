"use client";

import type { AnswerValue, BaseStep } from "@/engine/types";

interface Props {
  step: BaseStep;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function TextInput({ step, value, onChange }: Props) {
  const isLong = step.type === "long_text";
  const text = typeof value === "string" ? value : "";
  const sharedClasses =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-900";

  if (isLong) {
    return (
      <textarea
        rows={5}
        className={sharedClasses + " resize-y"}
        placeholder={step.placeholder ?? ""}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      className={sharedClasses}
      placeholder={step.placeholder ?? ""}
      value={text}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
