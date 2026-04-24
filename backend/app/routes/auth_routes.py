from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.models.user_model import UserCreate, UserLogin, User
from app.core.security import get_current_user
from app.core.security import create_access_token
from app.schemas.auth_schema import FirebaseLoginRequest, UserResponse
from app.services.auth_service import AuthService
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = settings.SESSION_COOKIE_NAME


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
async def register(payload: UserCreate):
    return await AuthService.register(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        program_name=payload.program_name,
        year_of_study=payload.year_of_study,
    )


@router.post("/login")
async def login(payload: UserLogin, response: Response):
    result = await AuthService.login(payload.email, payload.password)

    # Legacy login cookie for existing email/password flow.
    response.set_cookie(
        key="edusense_token",
        value=result["token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Do not return token to frontend (cookie handles it)
    return {"message": result["message"], "user": result["user"]}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    """Request password reset link - sends email with reset token"""
    return await AuthService.forgot_password(payload.email)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """Reset password using token from email"""
    return await AuthService.reset_password(payload.token, payload.new_password)


@router.post("/firebase-login")
async def firebase_login(payload: FirebaseLoginRequest, response: Response):
    try:
        firebase_payload = await AuthService.verify_firebase_token(payload.id_token)
        user = await AuthService.create_or_update_user(firebase_payload)
        max_age = int(timedelta(days=settings.SESSION_EXPIRE_DAYS).total_seconds())
        expires = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

        session_mode = "firebase"
        try:
            session_cookie = await AuthService.create_session_cookie(payload.id_token)
            response.set_cookie(
                key=COOKIE_NAME,
                value=session_cookie,
                httponly=True,
                secure=settings.COOKIE_SECURE,
                samesite=settings.COOKIE_SAMESITE,
                max_age=max_age,
                expires=expires,
                path="/",
                domain=settings.COOKIE_DOMAIN or None,
            )
        except HTTPException as exc:
            print(f"[firebase-login] Firebase session-cookie failed, fallback to legacy token: {exc.detail}")
            # Graceful fallback for local/dev environments where Firebase session cookies fail.
            session_mode = "legacy"
            legacy_token = create_access_token(
                {"user_id": str(user.id), "email": user.email},
                expires_minutes=settings.SESSION_EXPIRE_DAYS * 24 * 60,
            )
            response.set_cookie(
                key="edusense_token",
                value=legacy_token,
                httponly=True,
                secure=settings.COOKIE_SECURE,
                samesite=settings.COOKIE_SAMESITE,
                max_age=max_age,
                expires=expires,
                path="/",
            )

    except HTTPException as exc:
        print(f"[firebase-login] HTTPException: {exc.detail}")
        raise
    except Exception as exc:
        print(f"[firebase-login] Unexpected error: {exc}")
        raise HTTPException(status_code=500, detail="Unexpected firebase login error") from exc

    return {
        "message": "Firebase login successful",
        "session_mode": session_mode,
        "user": UserResponse(
            id=str(user.id),
            email=user.email,
            firebase_uid=user.firebase_uid,
            name=user.name or user.full_name,
            profile_image=user.profile_image,
            created_at=user.created_at,
        ).model_dump(),
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/", domain=settings.COOKIE_DOMAIN or None)
    response.delete_cookie(key="edusense_token", path="/", domain=settings.COOKIE_DOMAIN or None)
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name or current_user.name,
            "name": current_user.name,
            "email": current_user.email,
            "firebase_uid": current_user.firebase_uid,
            "profile_image": current_user.profile_image,
            "bio": current_user.bio,
            "program_name": current_user.program_name,
            "year_of_study": current_user.year_of_study,
        }
    }


@router.get("/status")
async def auth_status(request: Request):
    try:
        current_user = await get_current_user(request)
        return {
            "authenticated": True,
            "user": {
                "id": str(current_user.id),
                "full_name": current_user.full_name or current_user.name,
                "name": current_user.name,
                "email": current_user.email,
                "firebase_uid": current_user.firebase_uid,
                "profile_image": current_user.profile_image,
            },
        }
    except HTTPException:
        return {"authenticated": False, "user": None}
