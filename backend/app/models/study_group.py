from beanie import Document
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import List, Optional, Literal, Dict, Any


class MeetingRecord(BaseModel):
    """Record of a completed or ongoing meeting."""
    platform: Literal["zoom", "teams"]
    meeting_link: str
    meeting_code: Optional[str] = None
    source: Optional[Literal["manual_link", "graph_api"]] = None
    provider_status: Optional[Literal["success", "failed", "expired"]] = None
    provider_error: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    join_events: List[Dict[str, Any]] = Field(default_factory=list)


class StudyGroup(Document):
    """MongoDB collection for peer study groups."""

    name: str = Field(min_length=1, max_length=100)
    module: str                     # e.g. "CS2040"
    schedule: str
    max_members: int = Field(ge=2, le=20, default=6)
    tags: List[str] = Field(default_factory=list)
    created_by: str                 # user_id of creator
    leader_name: Optional[str] = Field(default=None, min_length=2, max_length=60)
    leader_email: Optional[EmailStr] = None
    member_ids: List[str] = Field(default_factory=list)      # user_ids of all members
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # ── Meeting fields ──
    active_meeting: Optional[Dict[str, Any]] = None  # Current active meeting
    meeting_history: List[MeetingRecord] = Field(default_factory=list)  # Past meetings

    class Settings:
        name = "study_groups"


class StudyGroupCreate(BaseModel):
    """Request payload for creating a study group."""
    name: str = Field(min_length=1, max_length=100)
    module: str
    schedule: str
    max_members: int = Field(ge=2, le=20, default=6)
    tags: List[str] = Field(default_factory=list)
    leader_name: str = Field(min_length=2, max_length=60)
    leader_email: EmailStr

    @field_validator("leader_email")
    @classmethod
    def normalize_leader_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class StudyGroupUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    module: str
    schedule: str
    max_members: int = Field(ge=2, le=20, default=6)
    tags: List[str] = Field(default_factory=list)
    leader_name: str = Field(min_length=2, max_length=60)
    leader_email: EmailStr

    @field_validator("leader_email")
    @classmethod
    def normalize_leader_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class StudyGroupResponse(BaseModel):
    """Response schema for a study group."""
    id: str
    name: str
    module: str
    schedule: str
    max_members: int
    tags: List[str]
    created_by: str
    leader_name: str
    leader_email: str
    members: int        # derived from len(member_ids)
    is_joined: bool = False
    can_edit: bool = False
    created_at: datetime
    active_meeting: Optional[Dict[str, Any]] = None
    meeting_history: List[MeetingRecord] = Field(default_factory=list)
