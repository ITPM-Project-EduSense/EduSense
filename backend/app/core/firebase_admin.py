import json
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials

from app.core.config import settings


logger = logging.getLogger(__name__)


def initialize_firebase_admin() -> bool:
    """Initialize Firebase Admin exactly once when credentials are available."""
    if firebase_admin._apps:
        return True

    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        try:
            service_account = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred)
            return True
        except json.JSONDecodeError as exc:
            logger.warning("Skipping Firebase Admin initialization: invalid FIREBASE_SERVICE_ACCOUNT_JSON")
            return False

    if not settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        logger.warning(
            "Skipping Firebase Admin initialization: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON is not set"
        )
        return False

    service_account_path = Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    if not service_account_path.exists():
        logger.warning(
            "Skipping Firebase Admin initialization: service account file not found at %s",
            service_account_path,
        )
        return False

    cred = credentials.Certificate(str(service_account_path))
    firebase_admin.initialize_app(cred)
    return True


def ensure_firebase_initialized() -> None:
    initialize_firebase_admin()
