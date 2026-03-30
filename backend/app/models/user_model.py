from beanie import Document
from pydantic import EmailStr, Field, BaseModel, field_validator
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
    
    # Password reset fields
    reset_token_hash: Optional[str] = None
    reset_token_expires_at: Optional[datetime] = None

    class Settings:
        name = "users"  # Mongo collection name


class UserCreate(BaseModel):
    """Request model for user registration."""
    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    program_name: Optional[str] = Field(default=None, max_length=120)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if cleaned.isdigit():
            raise ValueError("Name cannot contain only numbers")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        pwd = value.strip()
        if len(pwd) < 6:
            raise ValueError("Password must be at least 6 characters")
        return pwd

    @field_validator("program_name")
    @classmethod
    def normalize_program_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_login_password(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Password is required")
        return cleaned


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""
    full_name: str = Field(min_length=2, max_length=60)
    bio: Optional[str] = None
    program_name: Optional[str] = Field(default=None, max_length=120)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)

    @field_validator("full_name")
    @classmethod
    def normalize_profile_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return cleaned

    @field_validator("program_name")
    @classmethod
    def normalize_profile_program(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None
