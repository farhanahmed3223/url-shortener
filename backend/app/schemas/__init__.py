from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime, date
from typing import Optional


# ── Request schemas ──────────────────────────────────────────────────────────

class LinkCreate(BaseModel):
    url: str
    custom_slug: Optional[str] = None
    expires_at: Optional[datetime] = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        if len(v) > 2048:
            raise ValueError("URL too long (max 2048 chars)")
        return v


# ── Response schemas ─────────────────────────────────────────────────────────

class LinkResponse(BaseModel):
    id: int
    short_code: str
    original_url: str
    owner_id: Optional[str]
    custom_slug: bool
    created_at: datetime
    expires_at: Optional[datetime]
    short_url: str
    click_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class DailyClickStat(BaseModel):
    date: date
    clicks: int


class StatsResponse(BaseModel):
    short_code: str
    original_url: str
    total_clicks: int
    clicks_today: int
    created_at: datetime
    expires_at: Optional[datetime]
    daily_stats: list[DailyClickStat]


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str


class UserCreate(BaseModel):
    id: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
