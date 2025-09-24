import type { Progress } from "@/engine/types";

interface Props {
  progress: Progress | null;
}

export function ProgressBar({ progress }: Props) {
  if (!progress) return null;
  const overallPct = Math.round(
    (progress.overall_index / Math.max(progress.overall_total, 1)) * 100,
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>
          {progress.section_label
            ? `${progress.section_label} \u00b7 ${progress.section_index} of ${progress.section_total}`
            : `Step ${progress.overall_index} of ${progress.overall_total}`}
        </span>
        <span>{overallPct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${overallPct}%` }}
        />
      </div>
    </div>
  );
}
