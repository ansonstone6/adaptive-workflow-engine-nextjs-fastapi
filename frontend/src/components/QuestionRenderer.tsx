"use client";

import type { AnswerValue, BaseStep } from "@/engine/types";
import { InfoStep } from "./questions/InfoStep";
import { MultiChoice } from "./questions/MultiChoice";
import { Scale } from "./questions/Scale";
import { SingleChoice } from "./questions/SingleChoice";
import { TextInput } from "./questions/TextInput";

interface Props {
  step: BaseStep;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionRenderer({ step, value, onChange }: Props) {
  switch (step.type) {
    case "info":
      return <InfoStep step={step} />;
    case "single_choice":
      return <SingleChoice step={step} value={value} onChange={onChange} />;
    case "multi_choice":
      return <MultiChoice step={step} value={value} onChange={onChange} />;
    case "scale":
      return <Scale step={step} value={value} onChange={onChange} />;
    case "short_text":
    case "long_text":
      return <TextInput step={step} value={value} onChange={onChange} />;
    default:
      return (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Unsupported question type: <code>{step.type}</code>
        </div>
      );
  }
}
