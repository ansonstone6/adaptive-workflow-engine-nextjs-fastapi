"""Application settings loaded from environment.

Falls back to local SQLite when no DATABASE_URL is provided so the demo
runs out-of-the-box.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def _normalize_postgres_url(url: str) -> str:
    """Render and other hosts often set DATABASE_URL without a SQLAlchemy driver.

    Accept ``postgres://`` / ``postgresql://`` and force psycopg v3
    (``postgresql+psycopg://``) so the engine matches ``psycopg[binary]``
    in requirements.
    """
    if not url.startswith(("postgres://", "postgresql://")):
        return url
    scheme, _, remainder = url.partition("://")
    if "+" in scheme:
        return url
    if scheme == "postgres":
        return f"postgresql+psycopg://{remainder}"
    if scheme == "postgresql":
        return f"postgresql+psycopg://{remainder}"
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'demo.db'}"
    cors_origins: str = "http://localhost:3000"
    config_path: str = str(BACKEND_ROOT / "app" / "config" / "study.json")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> object:
        if isinstance(v, str):
            return _normalize_postgres_url(v)
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
