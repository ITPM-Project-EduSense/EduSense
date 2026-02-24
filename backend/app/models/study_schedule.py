from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field


class StudySession(BaseModel):
    """A single study session within a schedule."""
    day: int = Field(..., description="Day number (1, 2, 3...)")
    date: str = Field(..., description="Date string (e.g., '2026-03-01')")
    day_name: str = Field(..., description="Day name (e.g., 'Monday')")
    topics: List[str] = Field(..., description="Topics to study")
    duration_hours: float = Field(..., description="Recommended study duration in hours")
    focus_level: str = Field(..., description="low, medium, or high")
    tips: str = Field(default="", description="AI-generated study tips for this session")


class StudySchedule(Document):
    """MongoDB document model for AI-generated study schedules."""

    task_id: Optional[str] = Field(None, description="Linked task ID")
    title: str = Field(..., min_length=1, max_length=300)
    subject: str = Field(..., min_length=1, max_length=100)
    deadline: datetime
    total_topics: int = Field(default=0)
    total_days: int = Field(default=0)
    total_hours: float = Field(default=0)
    extracted_topics: List[str] = Field(default_factory=list)
    sessions: List[StudySession] = Field(default_factory=list)
    ai_summary: str = Field(default="", description="AI-generated overview of the study plan")
    ai_tips: str = Field(default="", description="General AI study tips")
    original_filename: str = Field(default="")
    status: str = Field(
        default="active",
        description="active or completed"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "study_schedules"

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Data Structures Final Exam Prep",
                "subject": "Data Structures",
                "deadline": "2026-03-15T23:59:00",
                "total_topics": 8,
                "total_days": 10,
            }
        }


# --- API Response Schemas ---

class StudySessionResponse(BaseModel):
    day: int
    date: str
    day_name: str
    topics: List[str]
    duration_hours: float
    focus_level: str
    tips: str


class StudyScheduleResponse(BaseModel):
    id: str
    task_id: Optional[str]
    title: str
    subject: str
    deadline: datetime
    total_topics: int
    total_days: int
    total_hours: float
    extracted_topics: List[str]
    sessions: List[StudySessionResponse]
    ai_summary: str
    ai_tips: str
    original_filename: str
    status: str
    created_at: datetime