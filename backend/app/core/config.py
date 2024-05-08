from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "URL Shortener"
    debug: bool = False
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/urlshortener"
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 600
    clerk_secret_key: str = ""
    anon_rate_limit: int = 5
    rate_limit_window: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
