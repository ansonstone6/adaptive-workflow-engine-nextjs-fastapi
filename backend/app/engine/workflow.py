"""Adaptive workflow engine.

Pure-function core: given a study config and a respondent's accumulated
answers, decide which step to render next, validate incoming responses,
and produce a progress summary. The engine does not touch the database
and has no side effects, which keeps it cheap to unit-test.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


# ---------- public types ----------


@dataclass(slots=True)
class Progress:
    overall_index: int        # 1-based position among visible steps
    overall_total: int        # total visible steps for this respondent
    section_id: str | None
    section_label: str | None
    section_index: int        # 1-based position within the section
    section_total: int


@dataclass(slots=True)
class NextStepResult:
    step: dict | None         # full step config to render, None if done
    progress: Progress | None
    is_terminal: bool         # current step explicitly ends the flow


# ---------- engine ----------


class Engine:
    """Owns the routing logic for a single study config."""

    def __init__(self, study: dict[str, Any]):
        self.study = study
        self._steps: list[dict] = study["steps"]
        self._by_id: dict[str, dict] = {s["id"]: s for s in self._steps}
        self._sections: dict[str, dict] = {
            s["id"]: s for s in study.get("sections", [])
        }

    def step_by_id(self, step_id: str) -> dict | None:
        return self._by_id.get(step_id)

    # ----- visibility -----

    def visible_steps(self, answers: dict[str, Any]) -> list[dict]:
        """Materialise the steps this respondent should see, given answers so far."""
        return [s for s in self._steps if self._show(s, answers)]

    def _show(self, step: dict, answers: dict[str, Any]) -> bool:
        cond = step.get("show_if")
        if not cond:
            return True
        # show_if is a flat AND of {field: value | [values]} predicates.
        for key, expected in cond.items():
            actual = answers.get(key)
            if isinstance(expected, list):
                if actual not in expected:
                    return False
            else:
                if actual != expected:
                    return False
        return True

    # ----- navigation -----

    def next_step(
        self,
        answers: dict[str, Any],
        *,
        after_id: str | None = None,
    ) -> NextStepResult:
        """Return the step to render next.

        ``after_id`` is the id of the step the respondent just completed,
        or ``None`` for a brand new session. We always recompute visibility
        from the latest answers so retroactive branching is safe.
        """
        visible = self.visible_steps(answers)
        if not visible:
            return NextStepResult(step=None, progress=None, is_terminal=True)

        if after_id is None:
            target = visible[0]
        else:
            target = self._first_after(visible, after_id, answers)

        if target is None:
            return NextStepResult(step=None, progress=None, is_terminal=True)

        return NextStepResult(
            step=target,
            progress=self._progress_for(target, visible),
            is_terminal=bool(target.get("terminal")),
        )

    def _first_after(
        self, visible: list[dict], after_id: str, answers: dict[str, Any]
    ) -> dict | None:
        ids = [s["id"] for s in visible]
        if after_id not in ids:
            # The previous step is no longer visible (an earlier answer
            # changed). Fall back to the first step the respondent has
            # not yet answered.
            return self._first_unanswered(visible, answers)
        idx = ids.index(after_id)
        return visible[idx + 1] if idx + 1 < len(visible) else None

    def _first_unanswered(
        self, visible: list[dict], answers: dict[str, Any]
    ) -> dict | None:
        for s in visible:
            if s["id"] not in answers and s.get("type") != "info":
                return s
        return visible[-1] if visible else None

    def resume_step(self, answers: dict[str, Any]) -> NextStepResult:
        """Pick the right place to drop a returning respondent."""
        visible = self.visible_steps(answers)
        if not visible:
            return NextStepResult(step=None, progress=None, is_terminal=True)
        target = self._first_unanswered(visible, answers) or visible[-1]
        return NextStepResult(
            step=target,
            progress=self._progress_for(target, visible),
            is_terminal=bool(target.get("terminal")),
        )

    # ----- progress -----

    def _progress_for(self, step: dict, visible: list[dict]) -> Progress:
        ids = [s["id"] for s in visible]
        overall_index = ids.index(step["id"]) + 1
        section_id = step.get("section")
        section_steps = [s for s in visible if s.get("section") == section_id]
        section_total = len(section_steps) or 1
        section_index = (
            [s["id"] for s in section_steps].index(step["id"]) + 1
            if section_id
            else 1
        )
        section_label = (
            self._sections.get(section_id, {}).get("label") if section_id else None
        )
        return Progress(
            overall_index=overall_index,
            overall_total=len(visible),
            section_id=section_id,
            section_label=section_label,
            section_index=section_index,
            section_total=section_total,
        )

    # ----- validation -----

    def validate_answer(self, step_id: str, value: Any) -> Any:
        """Coerce + validate a respondent's answer for a given step.

        Raises ``ValueError`` with a human-readable message on failure.
        Returns the (possibly coerced) value to persist.
        """
        step = self._by_id.get(step_id)
        if step is None:
            raise ValueError(f"unknown step: {step_id}")

        qtype = step["type"]
        required = step.get("required", False)

        if qtype == "info":
            return None

        if value in (None, "", []):
            if required:
                raise ValueError("this question is required")
            return value

        if qtype == "single_choice":
            allowed = {o["value"] for o in step.get("options", [])}
            if value not in allowed:
                raise ValueError("value not in allowed options")
            return value

        if qtype == "multi_choice":
            if not isinstance(value, list):
                raise ValueError("expected a list of values")
            allowed = {o["value"] for o in step.get("options", [])}
            bad = [v for v in value if v not in allowed]
            if bad:
                raise ValueError(f"unknown options: {bad}")
            min_select = step.get("min_select", 0)
            max_select = step.get("max_select")
            if len(value) < min_select:
                raise ValueError(f"select at least {min_select}")
            if max_select is not None and len(value) > max_select:
                raise ValueError(f"select no more than {max_select}")
            return value

        if qtype == "scale":
            try:
                v = int(value)
            except (TypeError, ValueError) as exc:
                raise ValueError("scale answer must be an integer") from exc
            lo, hi = step.get("min", 1), step.get("max", 7)
            if not lo <= v <= hi:
                raise ValueError(f"scale answer must be between {lo} and {hi}")
            return v

        if qtype in ("short_text", "long_text"):
            if not isinstance(value, str):
                raise ValueError("text answer must be a string")
            max_len = step.get("max_length", 5000)
            return value[:max_len]

        # Unknown type: pass through. Keeps the engine forward-compatible
        # with question types added in the config layer.
        return value
