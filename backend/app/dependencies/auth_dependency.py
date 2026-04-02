import asyncio

from fastapi import HTTPException, Request
from firebase_admin import auth as firebase_auth

from app.core.config import settings
from app.core.firebase_admin import ensure_firebase_initialized
from app.models.user_model import User


async def get_current_user(request: Request) -> User:
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")

    ensure_firebase_initialized()

    try:
        decoded = await asyncio.to_thread(
            firebase_auth.verify_session_cookie,
            session_cookie,
            True,
        )
    except (firebase_auth.InvalidSessionCookieError, firebase_auth.ExpiredSessionCookieError):
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except firebase_auth.RevokedSessionCookieError:
        raise HTTPException(status_code=401, detail="Session revoked. Please log in again.")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid session payload")

    user = await User.find_one({"firebase_uid": uid})
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    return user
