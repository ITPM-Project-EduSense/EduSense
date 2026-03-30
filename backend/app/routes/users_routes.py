from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.user_model import UpdateProfileRequest, User

router = APIRouter(tags=["Users"])


@router.get("/users/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile information"""
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "bio": current_user.bio,
        "program_name": current_user.program_name,
        "year_of_study": current_user.year_of_study,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.put("/users/profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    current_user.full_name = payload.full_name.strip()
    current_user.bio = payload.bio
    current_user.program_name = payload.program_name
    current_user.year_of_study = payload.year_of_study

    await current_user.save()

    return {
        "message": "Profile updated",
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "bio": current_user.bio,
            "program_name": current_user.program_name,
            "year_of_study": current_user.year_of_study,
        },
    }
