from beanie import Document
from pydantic import EmailStr, Field, BaseModel
from datetime import datetime


class User(Document):
    """
    MongoDB User collection using Beanie ODM.
    """

    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"  # Mongo collection name


class UserCreate(BaseModel):
    """Request model for user registration."""
    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str