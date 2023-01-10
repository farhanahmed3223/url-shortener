from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models import Link, Click

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/{code}")
async def get_stats(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    count_result = await db.execute(select(func.count()).where(Click.link_id == link.id))
    return {"code": code, "click_count": count_result.scalar() or 0}
