from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, timedelta

from app.db.session import get_db
from app.db.models import Link, Click
from app.schemas import StatsResponse, DailyClickStat
from app.core.auth import require_auth

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/{code}", response_model=StatsResponse)
async def get_stats(
    code: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    # Fetch the link
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not your link")

    today = date.today()
    thirty_days_ago = today - timedelta(days=29)

    # Total clicks
    total_result = await db.execute(
        select(func.count(Click.id)).where(Click.link_id == link.id)
    )
    total_clicks = total_result.scalar() or 0

    # Clicks today
    today_result = await db.execute(
        select(func.count(Click.id)).where(
            Click.link_id == link.id,
            Click.clicked_at == today,
        )
    )
    clicks_today = today_result.scalar() or 0

    # Daily breakdown for last 30 days
    daily_result = await db.execute(
        select(Click.clicked_at, func.count(Click.id).label("cnt"))
        .where(
            Click.link_id == link.id,
            Click.clicked_at >= thirty_days_ago,
        )
        .group_by(Click.clicked_at)
        .order_by(Click.clicked_at)
    )
    rows = daily_result.all()

    # Build full 30-day range with zeros for missing days
    click_map = {row.clicked_at: row.cnt for row in rows}
    daily_stats = []
    for i in range(30):
        d = thirty_days_ago + timedelta(days=i)
        daily_stats.append(DailyClickStat(date=d, clicks=click_map.get(d, 0)))

    return StatsResponse(
        short_code=link.short_code,
        original_url=link.original_url,
        total_clicks=total_clicks,
        clicks_today=clicks_today,
        created_at=link.created_at,
        expires_at=link.expires_at,
        daily_stats=daily_stats,
    )
