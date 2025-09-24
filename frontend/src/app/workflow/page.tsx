"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/api/client";
import { ConfigPreview } from "@/components/ConfigPreview";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import type {
  AnswerValue,
  BaseStep,
  SessionState,
  StudyConfig,
} from "@/engine/types";

const SESSION_KEY = "swe.session_id";

function isAnswerEmpty(step: BaseStep, value: AnswerValue | undefined) {
  if (step.type === "info") return false;
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export default function WorkflowPage() {
  const [config, setConfig] = useState<StudyConfig | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [draftValue, setDraftValue] = useState<AnswerValue | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const currentStep = session?.current_step ?? null;

  const resetDraftFromSession = useCallback((s: SessionState) => {
    if (!s.current_step) {
      setDraftValue(undefined);
      return;
    }
    const stored = s.answers?.[s.current_step.id];
    setDraftValue(stored as AnswerValue | undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const cfg = await api.getConfig();
        if (cancelled) return;
        setConfig(cfg);

        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(SESSION_KEY)
            : null;
        let s: SessionState;
        if (stored) {
          try {
            s = await api.getSession(stored);
          } catch {
            window.localStorage.removeItem(SESSION_KEY);
            s = await api.createSession();
            window.localStorage.setItem(SESSION_KEY, s.session_id);
          }
        } else {
          s = await api.createSession();
          window.localStorage.setItem(SESSION_KEY, s.session_id);
        }
        if (cancelled) return;
        setSession(s);
        resetDraftFromSession(s);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "failed to load workflow";
        setBootError(`${msg}. Is the backend running at ${api.base}?`);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [resetDraftFromSession]);

  const canSubmit = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.type === "info") return true;
    if (!currentStep.required) return true;
    return !isAnswerEmpty(currentStep, draftValue);
  }, [currentStep, draftValue]);

  async function handleSubmit() {
    if (!session || !currentStep) return;
    setBusy(true);
    setError(null);
    try {
      const value = currentStep.type === "info" ? null : (draftValue ?? null);
      const next = await api.submitAnswer(
        session.session_id,
        currentStep.id,
        value,
      );
      setSession(next);
      resetDraftFromSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to submit");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestart() {
    setBusy(true);
    setError(null);
    try {
      const s = await api.createSession();
      window.localStorage.setItem(SESSION_KEY, s.session_id);
      setSession(s);
      resetDraftFromSession(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to start");
    } finally {
      setBusy(false);
    }
  }

  function handleExport() {
    if (!session) return;
    window.open(api.exportUrl(session.session_id), "_blank");
  }

  if (bootError) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-6 py-16">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-semibold">Could not start the demo.</p>
          <p className="mt-2">{bootError}</p>
          <p className="mt-3 text-xs opacity-70">
            See <code>backend/README</code> to start the API locally.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            &larr; Back
          </Link>
          <button
            type="button"
            onClick={handleRestart}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            Restart session
          </button>
        </header>

        <div className="mb-6">
          <ProgressBar progress={session?.progress ?? null} />
        </div>

        {session?.status === "completed" || (currentStep === null && session) ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-4">
            <h2 className="text-2xl font-semibold">All done.</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your responses have been recorded. Export the raw JSON or restart
              with a fresh session.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
              >
                Export responses
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
              >
                Start over
              </button>
            </div>
          </div>
        ) : currentStep ? (
          <div className="flex flex-1 flex-col">
            <h1 className="text-xl font-semibold leading-snug">
              {currentStep.title ?? currentStep.id}
            </h1>
            <div className="mt-6 flex-1">
              <QuestionRenderer
                step={currentStep}
                value={draftValue}
                onChange={setDraftValue}
              />
            </div>
            {error && (
              <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}
            <footer className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleExport}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Export current responses
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || busy}
                className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
              >
                {busy
                  ? "Saving..."
                  : currentStep.type === "info"
                  ? currentStep.continue_label ?? "Continue"
                  : "Continue"}
              </button>
            </footer>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading workflow...
          </div>
        )}
      </section>

      <ConfigPreview
        config={config}
        currentStep={currentStep}
        answers={session?.answers ?? {}}
      />
    </main>
  );
}
