"""Thin data-access layer.

Keeps SQLAlchemy specifics out of the route handlers.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.storage.models import WorkflowSession


def create_session(db: Session, *, study_id: str, user_agent: str | None = None) -> WorkflowSession:
    obj = WorkflowSession(study_id=study_id, user_agent=user_agent, answers={})
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_session(db: Session, session_id: str) -> WorkflowSession | None:
    return db.get(WorkflowSession, session_id)


def update_session(
    db: Session,
    obj: WorkflowSession,
    *,
    answers: dict | None = None,
    current_step: str | None = None,
    status: str | None = None,
) -> WorkflowSession:
    if answers is not None:
        # Replace wholesale so deletions also persist.
        obj.answers = dict(answers)
    if current_step is not None:
        obj.current_step = current_step
    if status is not None:
        obj.status = status
    obj.touch()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
