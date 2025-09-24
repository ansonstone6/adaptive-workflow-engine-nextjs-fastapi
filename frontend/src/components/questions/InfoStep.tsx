import type { BaseStep } from "@/engine/types";

interface Props {
  step: BaseStep;
}

export function InfoStep({ step }: Props) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      {step.body && (
        <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {step.body}
        </p>
      )}
    </div>
  );
}
