from datetime import datetime
from typing import Literal, Optional

from beanie import Document
from pydantic import BaseModel, EmailStr, Field, field_validator


InviteStatus = Literal["pending", "accepted", "declined"]


class StudyGroupInvite(Document):
    """MongoDB collection for study group email invites."""

    group_id: str
    group_name: str
    group_module: str
    invited_email: EmailStr
    invited_by_user_id: str
    invited_by_name: str
    status: InviteStatus = "pending"
    email_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

    class Settings:
        name = "study_group_invites"


class StudyGroupInviteCreate(BaseModel):
    invited_email: EmailStr

    @field_validator("invited_email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class StudyGroupInviteResponse(BaseModel):
    id: str
    group_id: str
    group_name: str
    group_module: str
    invited_email: str
    invited_by_user_id: str
    invited_by_name: str
    status: InviteStatus
    email_sent: bool = False
    created_at: datetime
    responded_at: Optional[datetime] = None
