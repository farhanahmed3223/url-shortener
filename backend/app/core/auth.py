"""
Clerk JWT verification for FastAPI.
Verifies the session token sent in the Authorization: Bearer <token> header.
"""
import httpx
from fastapi import HTTPException, Header, Depends
from typing import Optional
from app.core.config import settings


async def get_current_user_id(
    authorization: Optional[str] = Header(default=None),
) -> Optional[str]:
    """
    Extract and verify Clerk JWT. Returns user ID or None if unauthenticated.
    Does NOT raise — use require_auth for protected routes.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.clerk.com/v1/sessions/verify",
                params={"token": token},
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                timeout=5.0,
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data.get("user_id") or data.get("sub")
    except Exception:
        return None


async def require_auth(
    user_id: Optional[str] = Depends(get_current_user_id),
) -> str:
    """Dependency that requires authentication. Raises 401 if not authenticated."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
