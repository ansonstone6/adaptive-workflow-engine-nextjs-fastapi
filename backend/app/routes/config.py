"""Read-only access to the active study config."""

from __future__ import annotations

from fastapi import APIRouter

from app.config.loader import load_study

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
def get_active_config() -> dict:
    return load_study()
