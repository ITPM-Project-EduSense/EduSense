import asyncio
import secrets
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import HTTPException
from firebase_admin import auth as firebase_auth

from app.core.config import settings
from app.core.firebase_admin import ensure_firebase_initialized
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user_model import User
from app.services.email_service import EmailService


class AuthService:
    @staticmethod
    async def _verify_firebase_token_via_rest(id_token: str) -> dict[str, Any]:
        """Fallback verification for local/dev environments.

        Uses Firebase Identity Toolkit `accounts:lookup`, which validates the ID token
        server-side and returns canonical user identity fields.
        """
        if not settings.FIREBASE_WEB_API_KEY:
            raise HTTPException(
                status_code=401,
                detail="FIREBASE_WEB_API_KEY is missing for fallback verification",
            )

        url = (
            "https://identitytoolkit.googleapis.com/v1/accounts:lookup"
            f"?key={settings.FIREBASE_WEB_API_KEY}"
        )

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(url, json={"idToken": id_token})
            data = response.json()
        except Exception as exc:
            raise HTTPException(
                status_code=401,
                detail=f"Fallback Firebase verification failed: {str(exc)}",
            ) from exc

        users = data.get("users") if isinstance(data, dict) else None
        if not response.is_success or not users:
            error_message = (
                data.get("error", {}).get("message")
                if isinstance(data, dict)
                else "Unknown Firebase response"
            )
            raise HTTPException(
                status_code=401,
                detail=f"Fallback Firebase verification rejected token: {error_message}",
            )

        user = users[0]
        uid = user.get("localId")
        email = user.get("email")

        if not uid or not email:
            raise HTTPException(
                status_code=400,
                detail="Fallback Firebase token payload missing uid/email",
            )

        return {
            "uid": uid,
            "email": str(email).strip().lower(),
            "name": user.get("displayName") or email,
            "picture": user.get("photoUrl"),
        }

    @staticmethod
    async def verify_firebase_token(id_token: str) -> dict[str, Any]:
        ensure_firebase_initialized()

        try:
            decoded_token = await asyncio.to_thread(firebase_auth.verify_id_token, id_token)
        except Exception as admin_exc:
            print(f"[firebase-login] Admin SDK verification failed, trying REST fallback: {admin_exc}")
            try:
                return await AuthService._verify_firebase_token_via_rest(id_token)
            except HTTPException as rest_exc:
                raise HTTPException(
                    status_code=401,
                    detail=f"Firebase token rejected by Admin SDK and REST fallback: {rest_exc.detail}",
                ) from admin_exc

        uid = decoded_token.get("uid")
        email = decoded_token.get("email")

        if not uid or not email:
            raise HTTPException(status_code=400, detail="Firebase token missing uid/email")

        return {
            "uid": uid,
            "email": str(email).strip().lower(),
            "name": decoded_token.get("name") or decoded_token.get("email", ""),
            "picture": decoded_token.get("picture"),
        }

    @staticmethod
    async def create_or_update_user(firebase_payload: dict[str, Any]) -> User:
        uid = firebase_payload["uid"]
        email = firebase_payload["email"]
        name = firebase_payload.get("name")
        picture = firebase_payload.get("picture")

        user = await User.find_one({"firebase_uid": uid})

        if not user:
            user = await User.find_one({"email": email})

        if user:
            user.email = email
            user.firebase_uid = uid
            user.name = name
            user.full_name = name or user.full_name
            user.profile_image = picture
            user.updated_at = datetime.utcnow()
            await user.save()
            return user

        user = User(
            email=email,
            firebase_uid=uid,
            name=name,
            full_name=name,
            profile_image=picture,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        await user.insert()
        return user

    @staticmethod
    async def create_session_cookie(id_token: str) -> str:
        ensure_firebase_initialized()
        expires_in = timedelta(days=settings.SESSION_EXPIRE_DAYS)

        try:
            return await asyncio.to_thread(
                firebase_auth.create_session_cookie,
                id_token,
                expires_in=expires_in,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=401,
                detail=f"Failed to create Firebase session: {str(exc)}",
            ) from exc

    @staticmethod
    async def register(
        full_name: str,
        email: str,
        password: str,
        program_name: str = None,
        year_of_study: int = None,
    ):
        email_lower = email.lower().strip()

        existing = await User.find_one({"email": email_lower})
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = User(
            full_name=full_name.strip(),
            name=full_name.strip(),
            email=email_lower,
            password_hash=hash_password(password),
            program_name=program_name.strip() if program_name else None,
            year_of_study=year_of_study,
        )

        await user.insert()

        return {
            "message": "Registered successfully",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "program_name": user.program_name,
                "year_of_study": user.year_of_study,
            },
        }

    @staticmethod
    async def login(email: str, password: str):
        email_lower = email.lower().strip()
        invalid_login_message = "Invalid creadtials Email/Password isincorrect"

        user = await User.find_one({"email": email_lower})

        if not user:
            raise HTTPException(status_code=401, detail=invalid_login_message)

        if not user.password_hash or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail=invalid_login_message)

        token = create_access_token({"user_id": str(user.id), "email": user.email})

        return {
            "message": "Login success",
            "token": token,
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "program_name": user.program_name,
                "year_of_study": user.year_of_study,
            },
        }

    @staticmethod
    async def forgot_password(email: str):
        """Generate and send password reset email."""
        email_lower = email.lower().strip()

        user = await User.find_one({"email": email_lower})

        if not user:
            return {"message": "If email exists, password reset link will be sent"}

        reset_token = secrets.token_urlsafe(32)
        reset_token_hash = hash_password(reset_token)
        expires_at = datetime.utcnow() + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)

        user.reset_token_hash = reset_token_hash
        user.reset_token_expires_at = expires_at
        await user.save()

        await EmailService.send_password_reset_email(
            email=user.email,
            reset_token=reset_token,
            user_name=user.full_name or user.name or "EduSense User",
        )

        return {"message": "If email exists, password reset link will be sent"}

    @staticmethod
    async def reset_password(token: str, new_password: str):
        """Verify reset token and update password."""
        if not token or len(token) < 20:
            raise HTTPException(status_code=400, detail="Invalid reset token")

        if not new_password or len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

        user = await User.find_one({"reset_token_expires_at": {"$gt": datetime.utcnow()}})

        if not user:
            raise HTTPException(status_code=400, detail="Reset token expired or invalid")

        if not user.reset_token_hash or not verify_password(token, user.reset_token_hash):
            raise HTTPException(status_code=400, detail="Invalid reset token")

        user.password_hash = hash_password(new_password.strip())
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        user.updated_at = datetime.utcnow()
        await user.save()

        await EmailService.send_password_reset_confirmation(
            email=user.email,
            user_name=user.full_name or user.name or "EduSense User",
        )

        return {
            "message": "Password reset successfully",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
            },
        }
