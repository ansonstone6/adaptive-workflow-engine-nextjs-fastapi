"""FastAPI entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import config as config_routes
from app.routes import sessions as session_routes
from app.settings import settings
from app.storage.db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Adaptive Workflow Engine",
    description=(
        "Demo backend showcasing a config-driven survey workflow engine: "
        "branching, resumable sessions, and JSON export."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session_routes.router)
app.include_router(config_routes.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
