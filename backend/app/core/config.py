from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    NODE_ENV: str = "development"
    DATABASE_URL: str
    # Sync URL derived from async URL — used by Celery worker
    SYNC_DATABASE_URL: str = ""
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    # Celery / Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    # OpenAI
    OPENAI_API_KEY: str = ""
    # Storage
    STORAGE_PATH: str = "./storage"
    CHROMA_PATH: str = "./storage/chroma"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def build_sync_url(cls, v: str, info) -> str:
        """Derive a psycopg2-compatible sync URL from the async asyncpg URL."""
        if v:
            return v
        db_url = info.data.get("DATABASE_URL", "")
        return db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
