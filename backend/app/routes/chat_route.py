from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.chat_service import chat_with_coach

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    subject: Optional[str] = None
    student_level: Optional[str] = "Intermediate"


@router.post(
    "/ask",
    status_code=status.HTTP_200_OK,
    summary="Ask the AI Coach a question",
    response_model=Dict[str, Any]
)
async def ask_coach(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Given a message, convert into vector, compare with study concepts, and return AI Coach response.
    """
    
    # Delegate to the chat service
    response = await chat_with_coach(
        user_id=str(current_user.id),
        message=request.message,
        subject=request.subject,
        student_level=request.student_level
    )
    
    return {
        "success": True,
        "reply": response
    }
