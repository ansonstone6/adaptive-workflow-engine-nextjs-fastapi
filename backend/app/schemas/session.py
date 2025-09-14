"""Wire schemas for the session API."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProgressOut(BaseModel):
    overall_index: int
    overall_total: int
    section_id: str | None = None
    section_label: str | None = None
    section_index: int
    section_total: int


class SessionCreateIn(BaseModel):
    study_id: str | None = None  # falls back to active study


class StepOut(BaseModel):
    """A study step rendered to the client. Passes through whatever
    fields the config defines. The frontend is the schema authority for
    rendering, so we don't strip unknown keys."""

    model_config = ConfigDict(extra="allow")

    id: str
    type: str


class SessionStateOut(BaseModel):
    session_id: str
    study_id: str
    status: str
    answers: dict[str, Any]
    current_step: StepOut | None = None
    progress: ProgressOut | None = None
    is_terminal: bool = False
    updated_at: datetime


class AnswerIn(BaseModel):
    step_id: str
    value: Any = Field(default=None)


class ExportOut(BaseModel):
    session_id: str
    study_id: str
    status: str
    started_at: datetime
    updated_at: datetime
    answers: dict[str, Any]
