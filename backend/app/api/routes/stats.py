from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import date, timedelta
from app.db.session import get_db
from app.db.models import Link, Click

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/{code}")
async def get_stats(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    total = await db.execute(select(func.count()).where(Click.link_id == link.id))
    since = date.today() - timedelta(days=30)
    daily = await db.execute(
        select(Click.clicked_at, func.count().label("count"))
        .where(and_(Click.link_id == link.id, Click.clicked_at >= since))
        .group_by(Click.clicked_at)
        .order_by(Click.clicked_at)
    )
    return {
        "code": code,
        "total_clicks": total.scalar() or 0,
        "daily": [{"date": str(r.clicked_at), "clicks": r.count} for r in daily],
    }
