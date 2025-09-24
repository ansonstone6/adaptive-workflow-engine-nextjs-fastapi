// Shared workflow types. Mirror the backend Pydantic schemas closely
// enough that the frontend stays the source of truth for rendering.

export type AnswerValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[];

export interface SectionDef {
  id: string;
  label: string;
}

export interface OptionDef {
  value: string | number;
  label: string;
}

export interface BaseStep {
  id: string;
  type:
    | "info"
    | "single_choice"
    | "multi_choice"
    | "scale"
    | "short_text"
    | "long_text";
  section?: string;
  title?: string;
  body?: string;
  required?: boolean;
  show_if?: Record<string, AnswerValue>;
  terminal?: boolean;
  continue_label?: string;
  options?: OptionDef[];
  min?: number;
  max?: number;
  min_label?: string;
  max_label?: string;
  min_select?: number;
  max_select?: number;
  placeholder?: string;
  // Anything else the config defines passes through.
  [extra: string]: unknown;
}

export interface StudyConfig {
  study_id: string;
  title: string;
  description?: string;
  sections?: SectionDef[];
  steps: BaseStep[];
}

export interface Progress {
  overall_index: number;
  overall_total: number;
  section_id: string | null;
  section_label: string | null;
  section_index: number;
  section_total: number;
}

export interface SessionState {
  session_id: string;
  study_id: string;
  status: "in_progress" | "completed";
  answers: Record<string, AnswerValue>;
  current_step: BaseStep | null;
  progress: Progress | null;
  is_terminal: boolean;
  updated_at: string;
}
