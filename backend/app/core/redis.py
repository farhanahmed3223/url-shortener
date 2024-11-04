import redis.asyncio as aioredis
from redis.asyncio.connection import ConnectionPool
import os

_pool: ConnectionPool | None = None
_redis: aioredis.Redis | None = None

async def get_redis() -> aioredis.Redis:
    global _redis, _pool
    if _redis is None:
        _pool = ConnectionPool.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True,
            max_connections=20,
        )
        _redis = aioredis.Redis(connection_pool=_pool)
    return _redis

async def close_redis():
    global _redis, _pool
    if _redis:
        await _redis.aclose()
        _redis = None
    if _pool:
        await _pool.aclose()
        _pool = None
