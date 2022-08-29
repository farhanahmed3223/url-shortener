import redis.asyncio as aioredis
import os

_redis = None

async def get_redis():
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
    return _redis

async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
