import hashlib
import asyncio
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, Request
from firebase_admin import auth as firebase_auth
from app.core.config import settings
from app.core.firebase_admin import ensure_firebase_initialized
from app.models.user_model import User

COOKIE_NAME = "edusense_token"


def hash_password(password: str) -> str:
    """
    Hash password using SHA256.
    Simpler than bcrypt and no 72-byte limit.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """
    Compare raw password against stored hash.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest() == password_hash


def create_access_token(payload: dict, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {**payload, "exp": expire}
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


async def get_current_user(request: Request) -> User:
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_cookie:
        ensure_firebase_initialized()
        try:
            decoded = await asyncio.to_thread(
                firebase_auth.verify_session_cookie,
                session_cookie,
                True,
            )
            uid = decoded.get("uid")
            if not uid:
                raise HTTPException(status_code=401, detail="Invalid session payload")

            user = await User.find_one({"firebase_uid": uid})
            if not user:
                raise HTTPException(status_code=404, detail="User profile not found")
            return user
        except (firebase_auth.InvalidSessionCookieError, firebase_auth.ExpiredSessionCookieError):
            raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
        except firebase_auth.RevokedSessionCookieError:
            raise HTTPException(status_code=401, detail="Session revoked. Please log in again.")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid session")

    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("user_id")

    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await User.get(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user