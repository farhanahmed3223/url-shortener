from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.db.session import get_db
from app.db.models import Link
from app.core.redis import get_redis

router = APIRouter(tags=["redirect"])

@router.get("/r/{code}")
async def redirect_link(code: str, db: AsyncSession = Depends(get_db)):
    redis = await get_redis()
    cache_key = f"redirect:{code}"
    cached = await redis.get(cache_key)
    if cached:
        return RedirectResponse(url=cached, status_code=301)
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        return Response(content="Link not found", status_code=404)
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        return Response(content="Link expired", status_code=410)
    await redis.setex(cache_key, 600, link.original_url)
    return RedirectResponse(url=link.original_url, status_code=301)
