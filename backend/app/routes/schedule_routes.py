from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from beanie import PydanticObjectId
from app.models.study_schedule import (
    StudySchedule,
    StudySession,
    StudyScheduleResponse,
    StudySessionResponse,
)
from app.services.file_extractor import extract_text
from app.services.gemini_service import generate_study_schedule

router = APIRouter(prefix="/study-schedules", tags=["Study Schedules"])

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def schedule_to_response(schedule: StudySchedule) -> StudyScheduleResponse:
    """Convert a StudySchedule document to a response schema."""
    return StudyScheduleResponse(
        id=str(schedule.id),
        task_id=schedule.task_id,
        title=schedule.title,
        subject=schedule.subject,
        deadline=schedule.deadline,
        total_topics=schedule.total_topics,
        total_days=schedule.total_days,
        total_hours=schedule.total_hours,
        extracted_topics=schedule.extracted_topics,
        sessions=[
            StudySessionResponse(
                day=s.day,
                date=s.date,
                day_name=s.day_name,
                topics=s.topics,
                duration_hours=s.duration_hours,
                focus_level=s.focus_level,
                tips=s.tips,
            )
            for s in schedule.sessions
        ],
        ai_summary=schedule.ai_summary,
        ai_tips=schedule.ai_tips,
        original_filename=schedule.original_filename,
        status=schedule.status,
        created_at=schedule.created_at,
    )


# ─── POST /study-schedules/generate ─── Upload file & generate schedule ───
@router.post(
    "/generate",
    response_model=StudyScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload course material and generate AI study schedule",
)
async def generate_schedule(
    file: UploadFile = File(...),
    subject: str = Form(...),
    title: str = Form(""),
    deadline: str = Form(...),
    task_id: Optional[str] = Form(None),
):
    """
    Upload a course material file (PDF, PPTX, DOCX, Image) and
    generate an AI-powered study schedule using Google Gemini.
    """
    # Validate file extension
    filename = file.filename or "unknown"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit.",
        )

    # Parse deadline
    try:
        parsed_deadline = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid deadline format. Use ISO format (e.g., 2026-03-15T23:59:00)",
        )

    # Extract text from file
    extracted_text = extract_text(file_bytes, filename)

    # Generate AI schedule
    result = await generate_study_schedule(
        extracted_text=extracted_text,
        subject=subject,
        deadline=parsed_deadline,
        title=title or f"{subject} Study Plan",
        task_id=task_id,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to generate study schedule"),
        )

    # Save to database
    schedule = StudySchedule(
        task_id=result.get("task_id"),
        title=result["title"],
        subject=result["subject"],
        deadline=parsed_deadline,
        total_topics=result["total_topics"],
        total_days=result["total_days"],
        total_hours=result["total_hours"],
        extracted_topics=result["extracted_topics"],
        sessions=[
            StudySession(**session) for session in result["sessions"]
        ],
        ai_summary=result["ai_summary"],
        ai_tips=result["ai_tips"],
        original_filename=filename,
    )

    await schedule.insert()
    return schedule_to_response(schedule)


# ─── GET /study-schedules ─── Get all schedules ───
@router.get(
    "/",
    response_model=List[StudyScheduleResponse],
    summary="Get all study schedules",
)
async def get_all_schedules():
    """Retrieve all study schedules."""
    schedules = await StudySchedule.find_all().to_list()
    schedules.sort(key=lambda s: s.created_at, reverse=True)
    return [schedule_to_response(s) for s in schedules]


# ─── GET /study-schedules/{schedule_id} ─── Get a single schedule ───
@router.get(
    "/{schedule_id}",
    response_model=StudyScheduleResponse,
    summary="Get a single study schedule",
)
async def get_schedule(schedule_id: str):
    """Retrieve a single study schedule by ID."""
    schedule = await StudySchedule.get(PydanticObjectId(schedule_id))
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with ID {schedule_id} not found",
        )
    return schedule_to_response(schedule)


# ─── DELETE /study-schedules/{schedule_id} ─── Delete a schedule ───
@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a study schedule",
)
async def delete_schedule(schedule_id: str):
    """Delete a study schedule by ID."""
    schedule = await StudySchedule.get(PydanticObjectId(schedule_id))
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with ID {schedule_id} not found",
        )
    await schedule.delete()
    return {"message": f"Schedule '{schedule.title}' deleted successfully"}