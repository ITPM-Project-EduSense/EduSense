from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FirebaseLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)


class UserResponse(BaseModel):
    id: str
    email: str
    firebase_uid: Optional[str] = None
    name: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
