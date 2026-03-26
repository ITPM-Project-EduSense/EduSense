from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class ChatHistory(Document):
    """
    Stores AI coach chat turns per student in MongoDB.
    """

    user_id: str = Field(..., description="Student/User ID")
    subject: Optional[str] = Field(default=None, description="Optional subject filter used in chat")
    user_message: str = Field(..., min_length=1, description="Student question message")
    ai_reply: str = Field(..., min_length=1, description="AI Coach reply")
    context_used: str = Field(default="", description="Retrieved context used for answer generation")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp for this chat turn")

    class Settings:
        name = "chat_history"
