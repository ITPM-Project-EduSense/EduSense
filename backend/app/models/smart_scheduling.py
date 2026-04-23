from datetime import datetime, date
from typing import Optional, List
from typing_extensions import Literal

from beanie import Document
from pydantic import BaseModel, Field


class TaskResource(Document):
    """Material attached to a specific task and used for plan generation."""

    task_id: str = Field(..., description="Reference to Task ID")
    file_name: str = Field(..., min_length=1, max_length=255)
    file_type: str = Field(..., min_length=1, max_length=50)
    content_length: float = Field(..., gt=0, description="Pages or normalized size units")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "task_resources"


class StudyPlan(Document):
    """Generated plan metadata for a task."""

    task_id: str = Field(..., description="Reference to Task ID")
    total_hours: float = Field(..., ge=0.5)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "study_plans"


class StudySession(Document):
    """Individual study session generated under a study plan."""

    plan_id: str = Field(..., description="Reference to StudyPlan ID")
    task_id: str = Field(..., description="Reference to Task ID")
    session_type: Literal[
        "reading",
        "revision",
        "research",
        "implementation",
        "review",
        "practice",
    ]
    duration_minutes: int = Field(..., ge=30, le=120, description="Session duration (max 2 hours)")
    scheduled_day: date
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "study_sessions"


class TaskResourceCreate(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_type: str = Field(..., min_length=1, max_length=50)
    content_length: float = Field(..., gt=0)


class TaskResourceOut(BaseModel):
    id: str
    task_id: str
    file_name: str
    file_type: str
    content_length: float
    created_at: datetime


class StudySessionOut(BaseModel):
    id: str
    session_type: str
    duration_minutes: int
    scheduled_day: date


class StudyPlanOut(BaseModel):
    plan_id: str
    task_id: str
    total_hours: float
    created_at: datetime
    sessions: List[StudySessionOut]


class RegeneratePlanRequest(BaseModel):
    max_minutes_per_day: Optional[int] = Field(
        default=240,
        ge=60,
        le=600,
        description="Optional workload cap for regeneration",
    )
