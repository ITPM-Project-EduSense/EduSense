from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import BaseModel, Field


class Task(Document):
    """MongoDB document model for academic tasks."""

    user_id: str = Field(..., description="ID of the user who owns this task")
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: str = Field(..., min_length=1, max_length=100)
    deadline: datetime
    difficulty: str = Field(
        ..., pattern="^(easy|medium|hard)$",
        description="Task difficulty: easy, medium, or hard"
    )
    status: str = Field(
        default="pending",
        pattern="^(pending|in_progress|completed)$",
        description="Task status: pending, in_progress, or completed"
    )
    priority_score: Optional[float] = Field(
        default=None,
        description="AI-calculated priority score (set by system)"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tasks"  # MongoDB collection name

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Data Structures Assignment 2",
                "description": "Complete binary tree implementation",
                "subject": "Data Structures",
                "deadline": "2026-03-15T23:59:00",
                "difficulty": "hard",
                "status": "pending"
            }
        }


# --- Pydantic schemas for API request/response ---

class TaskCreate(BaseModel):
    """Schema for creating a new task (request body)."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: str = Field(..., min_length=1, max_length=100)
    deadline: datetime
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")


class TaskUpdate(BaseModel):
    """Schema for updating an existing task (request body)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    deadline: Optional[datetime] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")


class TaskResponse(BaseModel):
    """Schema for task API response."""
    id: str
    title: str
    description: Optional[str]
    subject: str
    deadline: datetime
    difficulty: str
    status: str
    priority_score: Optional[float]
    created_at: datetime
    updated_at: datetime