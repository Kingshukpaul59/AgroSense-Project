"""
backend/app/core/dependencies.py

FastAPI dependency injection helpers.
One Redis connection pool shared across all requests.
"""

from __future__ import annotations

import os
from functools import lru_cache

import redis.asyncio as aioredis

from app.services.weather_service import WeatherService
from app.services.mandi_service   import MandiService


@lru_cache(maxsize=1)
def _get_redis_pool() -> aioredis.ConnectionPool:
    return aioredis.ConnectionPool.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        max_connections=20,
        decode_responses=True,
    )


def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=_get_redis_pool())


def get_sync_redis():
    """Synchronous Redis client for Celery tasks."""
    import redis as sync_redis
    return sync_redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
    )


async def get_weather_service() -> WeatherService:
    return WeatherService(redis_client=get_redis())


async def get_mandi_service() -> MandiService:
    api_key = os.getenv("DATA_GOV_API_KEY", "")
    return MandiService(api_key=api_key, redis_client=get_redis())