from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NexaRecruit AI Services"
    DEBUG: bool = False

    # Groq LLM
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Database (Supabase PostgreSQL)
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/postgres"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Rate limits
    MAX_RESUME_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
