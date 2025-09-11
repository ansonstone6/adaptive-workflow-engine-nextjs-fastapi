"""ORM models.

A respondent ``WorkflowSession`` holds the entire run: which study config
they're against, where they are in the flow, and every answer they've
given. Answers are stored as a JSON map keyed by question id so the
schema does not change when a study config changes.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.storage.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkflowSession(Base):
    __tablename__ = "workflow_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    study_id: Mapped[str] = mapped_column(String(64), index=True)
    current_step: Mapped[str | None] = mapped_column(String(64), nullable=True)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(16), default="in_progress")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    def touch(self) -> None:
        self.updated_at = _utcnow()
