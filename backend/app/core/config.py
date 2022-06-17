from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "URL Shortener"
    debug: bool = False
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/urlshortener"

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 600  # 10 minutes

    # Clerk
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # Rate limiting (anonymous users)
    anon_rate_limit: int = 5  # per hour per IP

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
