from fastapi import APIRouter, Response, Depends, HTTPException
from pydantic import BaseModel

from app.models.user_model import UserCreate, UserLogin, User
from app.core.security import get_current_user
from app.services.auth_service import AuthService
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = "edusense_token"


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

    # Store JWT in httpOnly cookie (recommended)
    response.set_cookie(
        key=COOKIE_NAME,
        value=result["token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
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


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "bio": current_user.bio,
            "program_name": current_user.program_name,
            "year_of_study": current_user.year_of_study,
        }
    }
