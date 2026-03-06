from beanie import Document
from pydantic import EmailStr, Field, BaseModel
from datetime import datetime
from typing import Optional


class User(Document):
    """
    MongoDB User collection using Beanie ODM.
    """

    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password_hash: str
    bio: Optional[str] = None
    program_name: Optional[str] = Field(default=None, max_length=120)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"  # Mongo collection name


class UserCreate(BaseModel):
    """Request model for user registration."""
    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6)
    program_name: Optional[str] = Field(default=None, max_length=120)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""
    full_name: str = Field(min_length=2, max_length=60)
    bio: Optional[str] = None
    program_name: Optional[str] = Field(default=None, max_length=120)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)
