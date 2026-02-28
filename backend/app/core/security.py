import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, Request
from app.core.config import settings
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


def create_access_token(payload: dict, expires_minutes: int | None = None) -> str:
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