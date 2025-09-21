"""Quick end-to-end check of the workflow engine + routes.

Run from the backend dir with the venv active:

    python smoke_test.py

Boots the FastAPI app in-process via httpx ASGI transport. No network.
"""

from __future__ import annotations

import asyncio

import httpx

from app.main import app
from app.storage.db import init_db


async def main() -> None:
    init_db()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as client:
        # Create a session.
        r = await client.post("/sessions", json={})
        r.raise_for_status()
        s = r.json()
        sid = s["session_id"]
        assert s["current_step"]["id"] == "consent", s
        print("created", sid, "first step:", s["current_step"]["id"])

        # Walk through: consent -> role=patient -> trust_pretest -> ...
        scripted: list[tuple[str, object]] = [
            ("consent", None),
            ("role", "patient"),
            ("trust_pretest", 4),
            ("channels", ["physician", "search"]),
            ("message", None),
            ("trust_posttest", 6),
            ("intent", 4),
            ("feedback", "Clear and well-sourced."),
            ("age", "30_44"),
            ("complete", None),
        ]
        for step_id, value in scripted:
            r = await client.post(
                f"/sessions/{sid}/answer",
                json={"step_id": step_id, "value": value},
            )
            r.raise_for_status()
            s = r.json()
            print(
                "submitted",
                step_id,
                "->",
                s["current_step"]["id"] if s["current_step"] else "DONE",
                "status",
                s["status"],
            )

        assert s["status"] == "completed", s

        # Export.
        r = await client.get(f"/sessions/{sid}/export")
        r.raise_for_status()
        export = r.json()
        assert export["answers"]["role"] == "patient"
        assert export["answers"]["channels"] == ["physician", "search"]
        print("export OK:", list(export["answers"].keys()))


if __name__ == "__main__":
    asyncio.run(main())
