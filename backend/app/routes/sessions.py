"""Session lifecycle endpoints.

POST   /sessions                  create a new run, return first step
GET    /sessions/{id}             fetch state, current step + progress
POST   /sessions/{id}/answer      submit answer to current step, advance
GET    /sessions/{id}/export      flat JSON export
"""

from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.loader import load_study
from app.engine import Engine, NextStepResult
from app.schemas.session import (
    AnswerIn,
    ExportOut,
    ProgressOut,
    SessionCreateIn,
    SessionStateOut,
    StepOut,
)
from app.storage import repository as repo
from app.storage.db import get_db
from app.storage.models import WorkflowSession

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _engine() -> Engine:
    return Engine(load_study())


def _to_state(
    obj: WorkflowSession, result: NextStepResult, study_id: str
) -> SessionStateOut:
    return SessionStateOut(
        session_id=obj.id,
        study_id=study_id,
        status=obj.status,
        answers=obj.answers or {},
        current_step=StepOut(**result.step) if result.step else None,
        progress=ProgressOut(**asdict(result.progress)) if result.progress else None,
        is_terminal=result.is_terminal,
        updated_at=obj.updated_at,
    )


@router.post("", response_model=SessionStateOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreateIn,
    db: Session = Depends(get_db),
    user_agent: str | None = Header(default=None, alias="User-Agent"),
):
    study = load_study()
    if payload.study_id and payload.study_id != study["study_id"]:
        raise HTTPException(404, f"unknown study {payload.study_id!r}")

    obj = repo.create_session(db, study_id=study["study_id"], user_agent=user_agent)
    engine = Engine(study)
    result = engine.next_step(obj.answers or {})
    if result.step:
        repo.update_session(db, obj, current_step=result.step["id"])
    return _to_state(obj, result, study["study_id"])


@router.get("/{session_id}", response_model=SessionStateOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    obj = repo.get_session(db, session_id)
    if obj is None:
        raise HTTPException(404, "session not found")
    if obj.status == "completed":
        from app.engine import NextStepResult as _N

        return _to_state(
            obj, _N(step=None, progress=None, is_terminal=True), obj.study_id
        )
    engine = _engine()
    result = engine.resume_step(obj.answers or {})
    return _to_state(obj, result, obj.study_id)


@router.post("/{session_id}/answer", response_model=SessionStateOut)
def submit_answer(
    session_id: str,
    payload: AnswerIn,
    db: Session = Depends(get_db),
):
    obj = repo.get_session(db, session_id)
    if obj is None:
        raise HTTPException(404, "session not found")
    if obj.status != "in_progress":
        raise HTTPException(409, f"session is {obj.status}")

    engine = _engine()
    try:
        clean = engine.validate_answer(payload.step_id, payload.value)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    answers = dict(obj.answers or {})
    if clean is None and payload.step_id in answers:
        # 'info' steps just advance; never write a None answer.
        pass
    elif clean is not None:
        answers[payload.step_id] = clean

    submitted = engine.step_by_id(payload.step_id)
    if submitted and submitted.get("terminal"):
        # A terminal step ends the run regardless of remaining visible
        # steps. Useful for screen-outs and final thank-you screens.
        from app.engine import NextStepResult as _N

        next_result = _N(step=None, progress=None, is_terminal=True)
    else:
        next_result = engine.next_step(answers, after_id=payload.step_id)
    new_status = "completed" if next_result.step is None else "in_progress"
    obj = repo.update_session(
        db,
        obj,
        answers=answers,
        current_step=next_result.step["id"] if next_result.step else None,
        status=new_status,
    )
    return _to_state(obj, next_result, obj.study_id)


@router.get("/{session_id}/export", response_model=ExportOut)
def export_session(session_id: str, db: Session = Depends(get_db)):
    obj = repo.get_session(db, session_id)
    if obj is None:
        raise HTTPException(404, "session not found")
    body = ExportOut(
        session_id=obj.id,
        study_id=obj.study_id,
        status=obj.status,
        started_at=obj.created_at,
        updated_at=obj.updated_at,
        answers=obj.answers or {},
    ).model_dump(mode="json")
    return JSONResponse(
        body,
        headers={
            "Content-Disposition": f'attachment; filename="session-{obj.id}.json"'
        },
    )
