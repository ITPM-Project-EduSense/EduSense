from datetime import datetime
from typing import List, Optional
from typing_extensions import Literal

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
    invited_emails: List[EmailStr]


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
