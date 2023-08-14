from fastapi import APIRouter, Depends, BackgroundTasks, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, date
from app.db.session import get_db
from app.db.models import Link, Click
from app.core.redis import get_redis

router = APIRouter(tags=["redirect"])

async def _log_click(link_id: int, country: str, db: AsyncSession):
    click = Click(link_id=link_id, clicked_at=date.today(), country=country[:2] if country else "XX")
    db.add(click)
    await db.commit()

@router.get("/r/{code}")
async def redirect_link(code: str, request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    redis = await get_redis()
    cache_key = f"redirect:{code}"
    cached = await redis.get(cache_key)
    if cached:
        country = request.headers.get("CF-IPCountry", "XX")
        result = await db.execute(select(Link.id).where(Link.short_code == code))
        link_id = result.scalar_one_or_none()
        if link_id:
            background_tasks.add_task(_log_click, link_id, country, db)
        return RedirectResponse(url=cached, status_code=301)
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        return Response(content="Link not found", status_code=404)
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        return Response(content="Link expired", status_code=410)
    await redis.setex(cache_key, 600, link.original_url)
    country = request.headers.get("CF-IPCountry", "XX")
    background_tasks.add_task(_log_click, link.id, country, db)
    return RedirectResponse(url=link.original_url, status_code=301)
