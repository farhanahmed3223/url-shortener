from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.db.session import get_db
from app.db.models import Link
from app.core.shortener import generate_short_code, validate_custom_slug
from app.core.redis import get_redis

router = APIRouter(prefix="/api/links", tags=["links"])

@router.post("", status_code=201)
async def create_link(url: str, custom_slug: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    if custom_slug:
        if not validate_custom_slug(custom_slug):
            raise HTTPException(status_code=422, detail="Invalid slug")
        existing = await db.execute(select(Link).where(Link.short_code == custom_slug))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Slug taken")
        code = custom_slug
    else:
        code = generate_short_code(url)
    link = Link(short_code=code, original_url=url)
    db.add(link)
    await db.commit()
    return {"short_code": code}

@router.get("")
async def list_links(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Link).order_by(Link.created_at.desc()))
    return result.scalars().all()

@router.delete("/{code}", status_code=204)
async def delete_link(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404)
    redis = await get_redis()
    await redis.delete(f"redirect:{code}")
    await db.delete(link)
    await db.commit()
