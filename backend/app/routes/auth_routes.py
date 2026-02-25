from fastapi import APIRouter, Response, Request, HTTPException
from jose import jwt, JWTError

from app.models.user import User
from app.models.user_model import UserCreate, UserLogin
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
async def me(request: Request):
    token = request.cookies.get("edusense_token")

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
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "user": {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
        }
    }