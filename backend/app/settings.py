"""Application settings loaded from environment.

Falls back to local SQLite when no DATABASE_URL is provided so the demo
runs out-of-the-box.
"""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'demo.db'}"
    cors_origins: str = "http://localhost:3000"
    config_path: str = str(BACKEND_ROOT / "app" / "config" / "study.json")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
