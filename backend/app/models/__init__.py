"""
Beanie document models for EduSense.
"""

from app.models.user_model import User, UserCreate, UserLogin, UpdateProfileRequest
from app.models.task import Task
from app.models.study_material import StudyMaterial, Concept
from app.models.study_schedule import StudySchedule
from app.models.smart_scheduling import TaskResource, StudyPlan, StudySession

__all__ = [
    "User",
    "UserCreate",
    "UserLogin",
    "UpdateProfileRequest",
    "Task",
    "StudyMaterial",
    "Concept",
    "StudySchedule",
    "TaskResource",
    "StudyPlan",
    "StudySession",
]
