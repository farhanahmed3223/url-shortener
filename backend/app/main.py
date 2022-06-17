from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.redis import get_redis, close_redis
from app.db.session import create_tables
from app.api.routes import links, redirect, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    await get_redis()  # warm up connection
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="URL Shortener API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(links.router)
app.include_router(redirect.router)
app.include_router(stats.router)


@app.get("/health")
async def health_check():
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    db_status = "ok"
    redis_status = "ok"

    # Check DB
    try:
        engine = create_async_engine(settings.database_url)
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
    except Exception as e:
        db_status = f"error: {e}"

    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
    except Exception as e:
        redis_status = f"error: {e}"

    overall = "ok" if db_status == "ok" and redis_status == "ok" else "degraded"
    return {"status": overall, "database": db_status, "redis": redis_status}
