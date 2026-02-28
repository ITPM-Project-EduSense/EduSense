from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.user_model import UpdateProfileRequest, User

router = APIRouter(tags=["Users"])


@router.put("/users/update-profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    current_user.full_name = payload.full_name.strip()
    current_user.bio = payload.bio

    await current_user.save()

    return {
        "message": "Profile updated",
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "bio": current_user.bio,
        },
    }
