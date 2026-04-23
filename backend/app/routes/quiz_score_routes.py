"""
API routes for saving and retrieving student quiz scores.
All endpoints are new – no existing files are modified.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.models.user_model import User
from app.core.security import get_current_user
from app.models.quiz_score_model import QuizScore

router = APIRouter(prefix="/quiz-scores", tags=["Quiz Scores"])


# ── Request / Response schemas ────────────────────────────────────────

class SaveQuizScoreRequest(BaseModel):
    pdf_id: str = Field(..., description="ID of the PDF material used")
    topic: str = Field(..., min_length=1, max_length=255, description="Topic label (usually the PDF filename)")
    total_questions: int = Field(..., ge=1)
    correct_answers: int = Field(..., ge=0)
    difficulty: str = Field(default="medium")


# ── POST  /api/quiz-scores  ──────────────────────────────────────────

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Save a student's quiz score",
    response_model=Dict[str, Any],
)
async def save_quiz_score(
    body: SaveQuizScoreRequest,
    current_user: User = Depends(get_current_user),
):
    """Persist a quiz attempt result to the database."""
    if body.correct_answers > body.total_questions:
        raise HTTPException(
            status_code=400,
            detail="correct_answers cannot exceed total_questions",
        )

    percentage = round((body.correct_answers / body.total_questions) * 100, 2)

    score = QuizScore(
        user_id=str(current_user.id),
        pdf_id=body.pdf_id,
        topic=body.topic,
        total_questions=body.total_questions,
        correct_answers=body.correct_answers,
        score_percentage=percentage,
        difficulty=body.difficulty,
    )
    await score.insert()

    return {
        "success": True,
        "message": "Quiz score saved",
        "score_id": str(score.id),
        "score_percentage": percentage,
    }


# ── GET  /api/quiz-scores  ───────────────────────────────────────────

@router.get(
    "",
    summary="Get all quiz scores for current user (optionally filter by topic)",
    response_model=Dict[str, Any],
)
async def get_quiz_scores(
    topic: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Return all quiz scores for the logged-in student.
    Pass `?topic=<name>` to filter by a specific topic / PDF.
    """
    query = {"user_id": str(current_user.id)}
    if topic:
        query["topic"] = topic

    scores = (
        await QuizScore.find(query)
        .sort("-attempted_at")
        .limit(200)
        .to_list()
    )

    return {
        "success": True,
        "count": len(scores),
        "scores": [
            {
                "id": str(s.id),
                "pdf_id": s.pdf_id,
                "topic": s.topic,
                "total_questions": s.total_questions,
                "correct_answers": s.correct_answers,
                "score_percentage": s.score_percentage,
                "difficulty": s.difficulty,
                "attempted_at": s.attempted_at.isoformat(),
            }
            for s in scores
        ],
    }


# ── GET  /api/quiz-scores/topics  ────────────────────────────────────

@router.get(
    "/topics",
    summary="Get distinct topics for which the student has quiz scores",
    response_model=Dict[str, Any],
)
async def get_quiz_score_topics(
    current_user: User = Depends(get_current_user),
):
    """Return a unique list of topics the student has attempted quizzes for."""
    scores = await QuizScore.find(
        QuizScore.user_id == str(current_user.id)
    ).to_list()

    topics = sorted({s.topic for s in scores})

    return {
        "success": True,
        "topics": topics,
    }
