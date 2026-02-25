from fastapi import APIRouter, Response, Depends

from app.models.user_model import UserCreate, UserLogin, User
from app.core.security import get_current_user
from app.services.auth_service import AuthService
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = "edusense_token"


@router.post("/register")
async def register(payload: UserCreate):
    return await AuthService.register(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password
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
        }
    }