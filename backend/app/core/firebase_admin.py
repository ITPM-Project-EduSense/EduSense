import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials

from app.core.config import settings


def initialize_firebase_admin() -> None:
    """Initialize Firebase Admin exactly once."""
    if firebase_admin._apps:
        return

    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        try:
            service_account = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred)
            return
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid FIREBASE_SERVICE_ACCOUNT_JSON") from exc

    if not settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        raise RuntimeError(
            "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."
        )

    service_account_path = Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    if not service_account_path.exists():
        raise RuntimeError(
            f"Firebase service account file not found: {service_account_path}"
        )

    cred = credentials.Certificate(str(service_account_path))
    firebase_admin.initialize_app(cred)


def ensure_firebase_initialized() -> None:
    initialize_firebase_admin()
