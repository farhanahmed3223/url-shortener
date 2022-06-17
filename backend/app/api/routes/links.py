from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from datetime import datetime, timezone
from typing import Optional

from app.db.session import get_db
from app.db.models import Link, User, Click
from app.schemas import LinkCreate, LinkResponse
from app.core.auth import get_current_user_id, require_auth
from app.core.shortener import generate_short_code, validate_custom_slug
from app.core.config import settings
from app.core.redis import get_redis

router = APIRouter(prefix="/api/links", tags=["links"])


def _build_short_url(short_code: str) -> str:
    return f"{settings.base_url}/r/{short_code}"


async def _get_click_count(db: AsyncSession, link_id: int) -> int:
    result = await db.execute(
        select(func.count(Click.id)).where(Click.link_id == link_id)
    )
    return result.scalar() or 0


async def _ensure_user_exists(db: AsyncSession, user_id: str, email: str = "") -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=user_id, email=email)
        db.add(user)
        await db.flush()
    return user


@router.post("", response_model=LinkResponse, status_code=201)
async def create_link(
    payload: LinkCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    redis = await get_redis()

    # --- Rate limiting for anonymous users ---
    if not user_id:
        client_ip = request.client.host
        rate_key = f"rate:anon:{client_ip}"
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, 3600)  # 1 hour window
        if count > settings.anon_rate_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Anonymous limit reached ({settings.anon_rate_limit} links/hour). Sign in for unlimited links.",
            )

    # --- Ensure owner exists in DB ---
    if user_id:
        # Get email from Clerk token header if available
        clerk_email = request.headers.get("X-Clerk-User-Email", "")
        await _ensure_user_exists(db, user_id, clerk_email)

    # --- Custom slug handling ---
    if payload.custom_slug:
        if not user_id:
            raise HTTPException(status_code=401, detail="Sign in to use custom slugs")
        if not validate_custom_slug(payload.custom_slug):
            raise HTTPException(
                status_code=422,
                detail="Slug must be 3-20 chars, alphanumeric + hyphens only",
            )
        existing = await db.execute(
            select(Link).where(Link.short_code == payload.custom_slug)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Slug already taken")
        short_code = payload.custom_slug
        is_custom = True
    else:
        # Auto-generate with collision check
        for _ in range(5):
            short_code = generate_short_code(payload.url)
            existing = await db.execute(
                select(Link).where(Link.short_code == short_code)
            )
            if not existing.scalar_one_or_none():
                break
        else:
            raise HTTPException(status_code=500, detail="Could not generate unique code")
        is_custom = False

    link = Link(
        short_code=short_code,
        original_url=payload.url,
        owner_id=user_id,
        custom_slug=is_custom,
        expires_at=payload.expires_at,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return LinkResponse(
        id=link.id,
        short_code=link.short_code,
        original_url=link.original_url,
        owner_id=link.owner_id,
        custom_slug=link.custom_slug,
        created_at=link.created_at,
        expires_at=link.expires_at,
        short_url=_build_short_url(link.short_code),
        click_count=0,
    )


@router.get("", response_model=list[LinkResponse])
async def list_links(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    query = select(Link).where(Link.owner_id == user_id)
    if search:
        query = query.where(Link.original_url.ilike(f"%{search}%"))
    if sort_by == "clicks":
        # Sort by subquery click count
        subq = (
            select(func.count(Click.id))
            .where(Click.link_id == Link.id)
            .correlate(Link)
            .scalar_subquery()
        )
        query = query.order_by(subq.desc())
    else:
        query = query.order_by(Link.created_at.desc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    links = result.scalars().all()

    output = []
    for link in links:
        click_count = await _get_click_count(db, link.id)
        output.append(
            LinkResponse(
                id=link.id,
                short_code=link.short_code,
                original_url=link.original_url,
                owner_id=link.owner_id,
                custom_slug=link.custom_slug,
                created_at=link.created_at,
                expires_at=link.expires_at,
                short_url=_build_short_url(link.short_code),
                click_count=click_count,
            )
        )
    return output


@router.get("/{code}", response_model=LinkResponse)
async def get_link(
    code: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not your link")

    click_count = await _get_click_count(db, link.id)
    return LinkResponse(
        id=link.id,
        short_code=link.short_code,
        original_url=link.original_url,
        owner_id=link.owner_id,
        custom_slug=link.custom_slug,
        created_at=link.created_at,
        expires_at=link.expires_at,
        short_url=_build_short_url(link.short_code),
        click_count=click_count,
    )


@router.delete("/{code}", status_code=204)
async def delete_link(
    code: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(require_auth),
):
    result = await db.execute(select(Link).where(Link.short_code == code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not your link")

    # Invalidate Redis cache
    redis = await get_redis()
    await redis.delete(f"redirect:{code}")

    await db.delete(link)
    await db.commit()
