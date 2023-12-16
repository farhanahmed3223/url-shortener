from fastapi import Request, HTTPException
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

async def get_current_user_id(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None

async def require_auth(request: Request) -> str:
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id
