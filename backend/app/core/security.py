import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings


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