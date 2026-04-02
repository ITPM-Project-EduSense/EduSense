"""
Beanie document models for EduSense.
"""

from app.models.user_model import User, UserCreate, UserLogin, UpdateProfileRequest
from app.models.task import Task
from app.models.study_material import StudyMaterial, Concept
from app.models.study_schedule import StudySchedule
from app.models.study_group import StudyGroup, StudyGroupCreate, StudyGroupResponse
from app.models.study_group_invite import (
    StudyGroupInvite,
    StudyGroupInviteCreate,
    StudyGroupInviteResponse,
)

__all__ = [
    "User",
    "UserCreate",
    "UserLogin",
    "UpdateProfileRequest",
    "Task",
    "StudyMaterial",
    "Concept",
    "StudySchedule",
    "StudyGroup",
    "StudyGroupCreate",
    "StudyGroupResponse",
    "StudyGroupInvite",
    "StudyGroupInviteCreate",
    "StudyGroupInviteResponse",
]
