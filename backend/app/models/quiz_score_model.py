"""
Beanie document model for storing student quiz scores.
Each record captures one quiz attempt: which PDF (topic), how many questions,
how many correct, and when it happened.
"""

from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class QuizScore(Document):
    """
    MongoDB document for persisting quiz attempt results.
    Allows students to review their performance topic-by-topic.
    """

    user_id: str = Field(..., index=True, description="ID of the student who took the quiz")
    pdf_id: str = Field(..., index=True, description="Reference to the PdfMaterial used for quiz generation")
    topic: str = Field(..., min_length=1, max_length=255, description="Topic / PDF filename used as label")
    total_questions: int = Field(..., ge=1, description="Total number of questions in the quiz")
    correct_answers: int = Field(..., ge=0, description="Number of correctly answered questions")
    score_percentage: float = Field(..., ge=0, le=100, description="Score expressed as a percentage")
    difficulty: str = Field(default="medium", description="Difficulty level of the quiz")
    attempted_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of quiz attempt")

    class Settings:
        name = "quiz_scores"  # MongoDB collection name
