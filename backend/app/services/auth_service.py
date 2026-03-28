from fastapi import HTTPException
from app.models.user_model import User
from app.core.security import hash_password, verify_password, create_access_token
from app.services.email_service import EmailService
from app.core.config import settings
import secrets
from datetime import datetime, timedelta


class AuthService:

    @staticmethod
    async def register(
        full_name: str,
        email: str,
        password: str,
        program_name: str = None,
        year_of_study: int = None,
    ):
        email_lower = email.lower().strip()

        # ✅ FIXED QUERY STYLE
        existing = await User.find_one({"email": email_lower})
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = User(
            full_name=full_name.strip(),
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
            }
        }

    @staticmethod
    async def login(email: str, password: str):
        email_lower = email.lower().strip()

        # ✅ FIXED QUERY STYLE
        user = await User.find_one({"email": email_lower})

        if not user:
            raise HTTPException(status_code=401, detail="Incorrect user credential password or email are incorrect")

        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect user credential password or email are incorrect")

        token = create_access_token({
            "user_id": str(user.id),
            "email": user.email
        })

        return {
            "message": "Login success",
            "token": token,
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "program_name": user.program_name,
                "year_of_study": user.year_of_study,
            }
        }

    @staticmethod
    async def forgot_password(email: str):
        """Generate and send password reset email"""
        email_lower = email.lower().strip()

        # Find user
        user = await User.find_one({"email": email_lower})
        
        if not user:
            # Security: Always return same message to prevent user enumeration
            return {"message": "If email exists, password reset link will be sent"}

        # Generate secure reset token
        reset_token = secrets.token_urlsafe(32)
        reset_token_hash = hash_password(reset_token)
        expires_at = datetime.utcnow() + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)

        # Store reset token in user document
        user.reset_token_hash = reset_token_hash
        user.reset_token_expires_at = expires_at
        await user.save()

        # Send email (non-blocking)
        await EmailService.send_password_reset_email(
            email=user.email,
            reset_token=reset_token,
            user_name=user.full_name
        )

        return {"message": "If email exists, password reset link will be sent"}

    @staticmethod
    async def reset_password(token: str, new_password: str):
        """Verify reset token and update password"""
        
        if not token or len(token) < 20:
            raise HTTPException(status_code=400, detail="Invalid reset token")

        if not new_password or len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

        # Find user with valid reset token
        user = await User.find_one({
            "reset_token_expires_at": {"$gt": datetime.utcnow()}
        })

        if not user:
            raise HTTPException(status_code=400, detail="Reset token expired or invalid")

        # Verify token
        if not verify_password(token, user.reset_token_hash):
            raise HTTPException(status_code=400, detail="Invalid reset token")

        # Update password
        user.password_hash = hash_password(new_password.strip())
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        await user.save()

        # Send confirmation email (non-blocking)
        await EmailService.send_password_reset_confirmation(
            email=user.email,
            user_name=user.full_name
        )

        return {
            "message": "Password reset successfully",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
            }
        }
