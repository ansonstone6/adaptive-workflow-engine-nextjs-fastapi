"""Study config loader.

A single JSON file is the source of truth for the instrument. The
backend never hardcodes question content. Loaded once at startup and
held in memory; production deployments would hot-reload from object
storage but that's out of scope for the demo.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.settings import settings


@lru_cache(maxsize=1)
def load_study() -> dict[str, Any]:
    path = Path(settings.config_path)
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    _validate(data)
    return data


def reload_study() -> dict[str, Any]:
    load_study.cache_clear()
    return load_study()


def _validate(cfg: dict[str, Any]) -> None:
    """Cheap structural checks. Fail fast on misauthored configs."""
    required_top = {"study_id", "title", "steps"}
    missing = required_top - cfg.keys()
    if missing:
        raise ValueError(f"study config missing keys: {sorted(missing)}")

    seen_ids: set[str] = set()
    for step in cfg["steps"]:
        sid = step.get("id")
        if not sid:
            raise ValueError("every step must have an id")
        if sid in seen_ids:
            raise ValueError(f"duplicate step id: {sid}")
        seen_ids.add(sid)
        if "type" not in step:
            raise ValueError(f"step {sid!r} missing type")
