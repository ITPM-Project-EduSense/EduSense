from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    """
    Incoming payload for Register.
    """
    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    """
    Incoming payload for Login.
    """
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserInDB(BaseModel):
    """
    How we store users in MongoDB.
    """
    id: str | None = Field(default=None, alias="_id")
    full_name: str
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserPublic(BaseModel):
    """
    Safe user data returned to frontend.
    """
    id: str
    full_name: str
    email: EmailStr