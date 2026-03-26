from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.chat_service import chat_with_coach, get_recent_chat_history
from app.models.chat_history import ChatHistory

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


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get student AI coach chat history",
    response_model=Dict[str, Any]
)
async def get_chat_history(
    subject: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    history = await get_recent_chat_history(
        user_id=str(current_user.id),
        subject=subject,
        limit=max(1, min(limit, 100)),
    )
    return {
        "success": True,
        "count": len(history),
        "history": history,
    }


@router.delete(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Delete student AI coach chat history",
    response_model=Dict[str, Any]
)
async def clear_chat_history(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = ChatHistory.find(ChatHistory.user_id == str(current_user.id))
    if subject:
        query = query.find(ChatHistory.subject == subject)
    docs = await query.to_list()
    deleted_count = 0
    for doc in docs:
        await doc.delete()
        deleted_count += 1
    return {
        "success": True,
        "deleted": deleted_count,
    }
