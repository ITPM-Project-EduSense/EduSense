from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import re
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.chat_service import chat_with_coach, get_recent_chat_history
from app.models.chat_history import ChatHistory
from app.models.study_material import StudyMaterial, Concept
from app.services.ai_summary_service import summarize_material
from beanie import PydanticObjectId
from groq import Groq
from app.core.config import settings

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

class QuizRequest(BaseModel):
    num_questions: int = 8
    difficulty: str = "medium"
    pdf_id: Optional[str] = None


@router.post(
    "/quiz",
    status_code=status.HTTP_200_OK,
    summary="Generate a quiz from uploaded study materials",
    response_model=Dict[str, Any]
)
async def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate multiple-choice quiz questions from the user's uploaded PDF concepts.
    """
    groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    # Gather concepts for context
    if request.pdf_id:
        concepts = await Concept.find(
            Concept.user_id == str(current_user.id),
            Concept.material_id == request.pdf_id,
        ).limit(20).to_list()
    else:
        concepts = await Concept.find(
            Concept.user_id == str(current_user.id),
        ).limit(20).to_list()

    if not concepts:
        raise HTTPException(
            status_code=404,
            detail="No concepts found. Please upload and process a document first."
        )

    context = "\n\n".join(
        f"- {c.title}: {c.summary}" for c in concepts
    )

    system_prompt = (
        "You are an educational quiz generator. "
        "Based on the provided study material, generate multiple-choice questions. "
        "Return ONLY valid JSON: a list of objects, each with: "
        "'question' (string), 'options' (list of 4 strings), "
        "'correct_index' (0-3), 'explanation' (string)."
    )
    user_prompt = (
        f"Generate {request.num_questions} {request.difficulty}-difficulty "
        f"multiple-choice questions from this content:\n\n{context}"
    )

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=2048,
        )
        raw = (response.choices[0].message.content or "").strip()

        # Extract JSON array from response
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in response")
        quiz = json.loads(match.group())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {e}")

    return {"success": True, "quiz": quiz}


@router.get(
    "/summary/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Get AI-generated summary and concepts for a study material",
    response_model=Dict[str, Any]
)
async def get_material_summary(
    material_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Return the stored summary, key points, and concepts for a given study material.
    """
    try:
        material = await StudyMaterial.get(PydanticObjectId(material_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid material ID.")

    if not material or material.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Material not found or unauthorized.")

    concepts = await Concept.find(Concept.material_id == material_id).to_list()

    summary_lines = [s.strip() for s in material.summary.split(".") if s.strip()] if material.summary else []

    return {
        "success": True,
        "filename": material.filename,
        "summary": summary_lines,
        "key_points": material.key_points,
        "concepts": [
            {"title": c.title, "difficulty": c.difficulty, "summary": c.summary}
            for c in concepts
        ],
        "difficult_terms": [],
    }