import type {
  AnswerValue,
  SessionState,
  StudyConfig,
} from "@/engine/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore json parse errors */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  base: API_BASE,
  getConfig: () => request<StudyConfig>("/config"),
  createSession: () =>
    request<SessionState>("/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getSession: (id: string) => request<SessionState>(`/sessions/${id}`),
  submitAnswer: (id: string, step_id: string, value: AnswerValue | null) =>
    request<SessionState>(`/sessions/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ step_id, value }),
    }),
  exportUrl: (id: string) => `${API_BASE}/sessions/${id}/export`,
};

export { ApiError };
