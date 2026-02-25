from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status, Query
from beanie import PydanticObjectId
from pydantic import BaseModel
from app.models.study_schedule import StudySchedule
from app.models.user_model import User
from app.models.task import Task
from app.models.study_material import Concept, StudyMaterial
from app.core.security import get_current_user
from app.services.file_extractor import extract_text
from app.services.gemini_service import generate_study_schedule
from app.services.semantic_match_service import match_task_to_concepts_with_scores
from app.services.schedule_rule_engine import generate_complete_schedule
from app.services.embedding_service import generate_embedding

router = APIRouter(prefix="/schedule", tags=["Schedules"])


# Response models for legacy endpoints
class StudyScheduleResponse(BaseModel):
    """Legacy response model for study schedules."""
    id: str
    task_id: Optional[str]
    subject: str
    deadline: str
    created_at: str
    
    class Config:
        from_attributes = True


def schedule_to_response(schedule: StudySchedule) -> StudyScheduleResponse:
    """Convert StudySchedule to response model."""
    return StudyScheduleResponse(
        id=str(schedule.id),
        task_id=schedule.task_id,
        subject=schedule.subject,
        deadline=schedule.deadline.isoformat(),
        created_at=schedule.created_at.isoformat()
    )

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _generate_default_concepts(task_title: str, subject: str, days_until_deadline: int) -> List[Dict[str, Any]]:
    """
    Generate default placeholder concepts when no study materials are uploaded.
    This allows schedule generation even without materials.
    
    Args:
        task_title: Title of the task
        subject: Subject name
        days_until_deadline: Number of days until deadline
        
    Returns:
        List of default concept dictionaries
    """
    # Create 5-7 default study phases
    num_concepts = min(7, max(3, days_until_deadline // 2))
    default_concepts = []
    
    # Default study phases
    phases = [
        {"title": "Fundamentals & Overview", "difficulty": "easy", "minutes": 90, "key": "intro"},
        {"title": "Core Concepts", "difficulty": "medium", "minutes": 120, "key": "core"},
        {"title": "Advanced Topics", "difficulty": "medium", "minutes": 120, "key": "advanced"},
        {"title": "Problem Solving & Practice", "difficulty": "hard", "minutes": 150, "key": "practice"},
        {"title": "Integration & Application", "difficulty": "hard", "minutes": 120, "key": "integration"},
        {"title": "Review & Consolidation", "difficulty": "easy", "minutes": 90, "key": "review"},
        {"title": "Final Preparation & Testing", "difficulty": "medium", "minutes": 100, "key": "final"},
    ]
    
    for i in range(min(num_concepts, len(phases))):
        phase = phases[i]
        default_concepts.append({
            "id": f"default_{phase['key']}_{i}",
            "title": f"{phase['title']} - {subject}",
            "summary": f"Focus on {phase['title'].lower()} aspects of {subject}. Please upload study materials to replace this placeholder with your actual course content.",
            "difficulty": phase["difficulty"],
            "estimated_minutes": phase["minutes"],
            "key_points": [
                f"Understand key {phase['key']} concepts",
                f"Review important {subject} {phase['key']} topics",
                f"Upload study materials to customize this section"
            ]
        })
    
    return default_concepts


# ─── GET /schedule/auto ─── Auto-generate schedule from task ───
@router.get(
    "/auto",
    summary="Auto-generate study schedule for a task",
    response_model=Dict[str, Any]
)
async def auto_generate_schedule(
    task_id: str = Query(..., description="Task ID to generate schedule for"),
    current_user: User = Depends(get_current_user)
):
    """
    Auto-generate a study schedule for a task by:
    1. Finding the task
    2. Matching task to concepts using semantic/keyword matching
    3. Using rule engine to generate deterministic schedule
    4. Saving and returning the schedule
    
    Returns existing schedule if already generated for this task.
    """
    try:
        # Check if schedule already exists for this task
        existing_schedule = await StudySchedule.find_one(
            StudySchedule.task_id == task_id,
            StudySchedule.user_id == str(current_user.id)
        )
        
        if existing_schedule:
            # Return existing schedule
            return {
                "success": True,
                "message": "Schedule already exists for this task",
                "schedule": _serialize_schedule(existing_schedule)
            }
        
        # Fetch the task
        task = await Task.get(PydanticObjectId(task_id))
        if not task or task.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Match task to concepts using semantic similarity
        matched_concepts = await match_task_to_concepts_with_scores(
            task_title=f"{task.title} {task.description or ''}",
            user_id=str(current_user.id),
            subject=task.subject,
            top_k=15,
            min_similarity=0.2
        )
        
        # If no concepts found, generate default concepts for the subject
        using_defaults = False
        if not matched_concepts:
            matched_concepts = _generate_default_concepts(
                task_title=task.title,
                subject=task.subject,
                days_until_deadline=(task.deadline - datetime.now()).days
            )
            using_defaults = True
        
        # Get key points from materials for this subject
        materials = await StudyMaterial.find(
            StudyMaterial.user_id == str(current_user.id),
            StudyMaterial.subject == task.subject
        ).to_list()
        
        all_key_points = []
        for material in materials:
            all_key_points.extend(material.key_points)
        
        # Generate complete schedule using rule engine
        blocks, timeline = await generate_complete_schedule(
            concepts=matched_concepts,
            task_title=task.title,
            subject=task.subject,
            deadline=task.deadline,
            material_key_points=all_key_points
        )
        
        # Create and save schedule
        schedule = StudySchedule(
            user_id=str(current_user.id),
            task_id=task_id,
            subject=task.subject,
            deadline=task.deadline,
            start_date=blocks[0].date if blocks else datetime.now().strftime('%Y-%m-%d'),
            end_date=blocks[-1].date if blocks else task.deadline.strftime('%Y-%m-%d'),
            blocks=blocks,
            timeline=timeline
        )
        
        await schedule.insert()
        
        message = (
            "Schedule generated successfully using study materials" 
            if not using_defaults 
            else "Schedule generated with default template. Upload study materials to customize this schedule."
        )
        
        return {
            "success": True,
            "message": message,
            "using_default_template": using_defaults,
            "schedule": _serialize_schedule(schedule)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate schedule: {str(e)}"
        )


def _serialize_schedule(schedule: StudySchedule) -> Dict[str, Any]:
    """Convert StudySchedule to JSON-serializable dict."""
    return {
        "id": str(schedule.id),
        "task_id": schedule.task_id,
        "subject": schedule.subject,
        "deadline": schedule.deadline.isoformat(),
        "start_date": schedule.start_date,
        "end_date": schedule.end_date,
        "blocks": [
            {
                "date": block.date,
                "start_time": block.start_time,
                "end_time": block.end_time,
                "subject": block.subject,
                "concept_title": block.concept_title,
                "concept_id": block.concept_id,
                "type": block.type,
                "key_points": block.key_points
            }
            for block in schedule.blocks
        ],
        "timeline": {
            "goal_title": schedule.timeline.goal_title,
            "days_remaining": schedule.timeline.days_remaining,
            "milestones": [
                {
                    "date": m.date,
                    "label": m.label,
                    "target": m.target,
                    "tips": m.tips
                }
                for m in schedule.timeline.milestones
            ],
            "success_criteria": schedule.timeline.success_criteria
        },
        "created_at": schedule.created_at.isoformat(),
        "updated_at": schedule.updated_at.isoformat()
    }


# Legacy routes below (keeping for backwards compatibility)
router_legacy = APIRouter(prefix="/study-schedules", tags=["Study Schedules (Legacy)"])


def schedule_to_response_legacy(schedule: StudySchedule) -> Dict[str, Any]:
    """Convert a legacy StudySchedule document to a response schema."""
    # This handles old schedule format if it exists
    return {
        "id": str(schedule.id),
        "task_id": schedule.task_id,
        "subject": schedule.subject,
        "deadline": schedule.deadline.isoformat(),
        "created_at": schedule.created_at.isoformat()
    }


# ─── POST /study-schedules/generate ─── Upload file & generate schedule (LEGACY) ───
# COMMENTED OUT: This endpoint is incompatible with the new StudySchedule model.
# Use POST /api/documents/upload + GET /schedule/auto instead.
#
# @router_legacy.post(
#     "/generate",
#     response_model=StudyScheduleResponse,
#     status_code=status.HTTP_201_CREATED,
#     summary="Upload course material and generate AI study schedule",
# )
# async def generate_schedule(
#     file: UploadFile = File(...),
#     subject: str = Form(...),
#     title: str = Form(""),
#     deadline: str = Form(...),
#     task_id: Optional[str] = Form(None),
# ):
#     """
#     Upload a course material file (PDF, PPTX, DOCX, Image) and
#     generate an AI-powered study schedule using Google Gemini.
#     """
#     raise HTTPException(
#         status_code=status.HTTP_501_NOT_IMPLEMENTED,
#         detail="This endpoint is deprecated. Use POST /api/documents/upload + GET /schedule/auto instead."
#     )


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


# ─── GET /study-schedules/stats ─── Get user's study statistics ───
@router.get(
    "/stats",
    summary="Get study statistics for current user",
    response_model=Dict[str, Any]
)
async def get_study_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive study statistics for the AI panel dashboard.
    
    Includes:
    - Total concepts available
    - Total study time
    - Active schedules
    - Difficulty distribution
    """
    try:
        # Get all concepts for this user
        all_concepts = await Concept.find(
            Concept.user_id == str(current_user.id)
        ).to_list()
        
        # Get all schedules (Note: StudySchedule doesn't have user_id, so we get all)
        all_schedules = await StudySchedule.find_all().to_list()
        
        # Calculate concept statistics
        total_study_minutes = sum(c.estimated_minutes for c in all_concepts) if all_concepts else 0
        difficulty_counts = {
            'easy': sum(1 for c in all_concepts if c.difficulty == 'easy'),
            'medium': sum(1 for c in all_concepts if c.difficulty == 'medium'),
            'hard': sum(1 for c in all_concepts if c.difficulty == 'hard')
        }
        
        # Get unique materials
        unique_materials = len(set(c.material_id for c in all_concepts if c.material_id)) if all_concepts else 0
        
        # Calculate averages safely
        avg_per_concept = round(total_study_minutes / len(all_concepts), 1) if all_concepts else 0
        total_study_hours = round(total_study_minutes / 60, 1) if total_study_minutes > 0 else 0
        
        return {
            "success": True,
            "total_concepts": len(all_concepts),
            "total_materials": unique_materials,
            "total_study_hours": total_study_hours,
            "concepts": {
                "total": len(all_concepts),
                "by_difficulty": difficulty_counts,
                "total_study_minutes": total_study_minutes,
                "total_study_hours": total_study_hours,
                "average_per_concept": avg_per_concept
            },
            "schedules": {
                "total": len(all_schedules),
                "active": len([s for s in all_schedules if hasattr(s, 'status') and s.status == "active"]),
                "completed": len([s for s in all_schedules if hasattr(s, 'status') and s.status == "completed"])
            },
            "materials": {
                "total_uploaded": unique_materials
            }
        }
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_study_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return a safe default response instead of crashing
        return {
            "success": False,
            "total_concepts": 0,
            "total_materials": 0,
            "total_study_hours": 0.0,
            "concepts": {
                "total": 0,
                "by_difficulty": {"easy": 0, "medium": 0, "hard": 0},
                "total_study_minutes": 0,
                "total_study_hours": 0.0,
                "average_per_concept": 0
            },
            "schedules": {
                "total": 0,
                "active": 0,
                "completed": 0
            },
            "materials": {
                "total_uploaded": 0
            },
            "error": str(e)
        }


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
    return {"message": f"Schedule deleted successfully", "schedule_id": schedule_id}


# ─── POST /schedule/generate-from-concepts ─── DEPRECATED ───
# COMMENTED OUT: This endpoint is incompatible with the new StudySchedule model.
# Use GET /schedule/auto instead, which provides the same functionality.
#
# The old endpoint tried to use StudySession objects and fields like 'sessions', 
# 'total_topics', etc., which don't exist in the new StudySchedule model.


# ─── GET /study-schedules/concepts/preview ─── Preview concepts for a task ───
@router.get(
    "/concepts/preview",
    summary="Preview matched concepts for a task",
    response_model=Dict[str, Any]
)
async def preview_task_concepts(
    task_id: str = Query(..., description="Task ID to preview concepts for"),
    top_k: int = Query(15, description="Number of concepts to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Preview which concepts will be matched to a task before generating a schedule.
    
    Useful for the AI panel to show users what material will be covered.
    Returns concepts with similarity scores and metadata.
    """
    # Fetch the task
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    # Get matched concepts with scores
    try:
        matched_concepts = await match_task_to_concepts_with_scores(
            task_title=f"{task.title} {task.subject}",
            user_id=str(current_user.id),
            top_k=top_k,
            min_similarity=0.3
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to match concepts: {str(e)}"
        )
    
    # Calculate statistics
    if matched_concepts:
        total_minutes = sum(c['estimated_minutes'] for c in matched_concepts)
        difficulty_counts = {
            'easy': sum(1 for c in matched_concepts if c['difficulty'] == 'easy'),
            'medium': sum(1 for c in matched_concepts if c['difficulty'] == 'medium'),
            'hard': sum(1 for c in matched_concepts if c['difficulty'] == 'hard')
        }
    else:
        total_minutes = 0
        difficulty_counts = {'easy': 0, 'medium': 0, 'hard': 0}
    
    return {
        "success": True,
        "task_id": task_id,
        "task_title": task.title,
        "task_subject": task.subject,
        "task_deadline": task.deadline.isoformat(),
        "matched_concepts": matched_concepts,
        "statistics": {
            "total_concepts": len(matched_concepts),
            "total_study_minutes": total_minutes,
            "total_study_hours": round(total_minutes / 60, 1),
            "difficulty_distribution": difficulty_counts,
            "average_similarity": round(
                sum(c['similarity_score'] for c in matched_concepts) / len(matched_concepts), 3
            ) if matched_concepts else 0
        }
    }


# ─── GET /study-schedules/concepts/all ─── Get all concepts for user ───
@router.get(
    "/concepts/all",
    summary="Get all study concepts for current user",
    response_model=Dict[str, Any]
)
async def get_all_concepts(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: easy, medium, hard"),
    limit: int = Query(50, description="Maximum concepts to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all study concepts for the current user, optionally filtered by difficulty.
    
    Useful for the AI panel to show available study materials and allow
    manual concept selection.
    """
    try:
        # Build query
        query = {"user_id": str(current_user.id)}
        if difficulty and difficulty in ["easy", "medium", "hard"]:
            query["difficulty"] = difficulty
        
        # Fetch concepts
        concepts = await Concept.find(query).limit(limit).to_list()
        
        # Format response
        concept_list = [
            {
                "id": str(c.id),
                "title": c.title,
                "summary": c.summary,
                "difficulty": c.difficulty,
                "estimated_minutes": c.estimated_minutes,
                "material_id": c.material_id,
                "created_at": c.created_at.isoformat()
            }
            for c in concepts
        ]
        
        # Calculate statistics
        total_minutes = sum(c.estimated_minutes for c in concepts)
        difficulty_counts = {
            'easy': sum(1 for c in concepts if c.difficulty == 'easy'),
            'medium': sum(1 for c in concepts if c.difficulty == 'medium'),
            'hard': sum(1 for c in concepts if c.difficulty == 'hard')
        }
        
        return {
            "success": True,
            "concepts": concept_list,
            "statistics": {
                "total_concepts": len(concepts),
                "total_study_minutes": total_minutes,
                "total_study_hours": round(total_minutes / 60, 1),
                "difficulty_distribution": difficulty_counts
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve concepts: {str(e)}"
        )


# ─── POST /study-schedules/validate-feasibility ─── Check if schedule is feasible ───
@router.post(
    "/validate-feasibility",
    summary="Validate if a schedule is feasible",
    response_model=Dict[str, Any]
)
async def validate_feasibility(
    task_id: str = Form(..., description="Task ID to validate"),
    availability: Optional[str] = Form(None, description="JSON string of availability windows"),
    current_user: User = Depends(get_current_user)
):
    """
    Validate if concepts can be scheduled before the task deadline.
    
    Provides feasibility analysis including:
    - Whether schedule is possible
    - Time utilization percentage
    - Recommendations
    
    Useful for the AI panel to warn users if deadline is too tight.
    """
    # Fetch the task
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    # Get matched concepts
    try:
        from app.services.semantic_match_service import match_task_to_concepts
        matched_concepts = await match_task_to_concepts(
            task_title=f"{task.title} {task.subject}",
            user_id=str(current_user.id),
            top_k=15,
            min_similarity=0.3
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to match concepts: {str(e)}"
        )
    
    if not matched_concepts:
        return {
            "success": True,
            "feasible": True,
            "message": "No concepts found to schedule",
            "matched_concepts": 0
        }
    
    # Parse availability if provided
    availability_dict = None
    if availability:
        try:
            import json
            availability_dict = json.loads(availability)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid availability JSON format"
            )
    
    # Validate feasibility
    try:
        feasibility = validate_schedule_feasibility(
            concepts=matched_concepts,
            deadline=task.deadline,
            availability=availability_dict,
            start_date=datetime.now()
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "task_title": task.title,
            "matched_concepts": len(matched_concepts),
            **feasibility
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate feasibility: {str(e)}"
        )


# ─── GET /study-schedules/recommendations ─── Get study recommendations ───
@router.get(
    "/recommendations",
    summary="Get recommended concepts to study",
    response_model=Dict[str, Any]
)
async def get_study_recommendations(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    max_minutes: Optional[int] = Query(None, description="Maximum time available"),
    limit: int = Query(20, description="Maximum recommendations"),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommended concepts to study based on difficulty and available time.
    
    Useful for the AI panel to suggest what to study next when user has
    limited time or wants to focus on specific difficulty level.
    """
    try:
        recommendations = await get_concept_recommendations(
            user_id=str(current_user.id),
            difficulty_filter=difficulty,
            max_minutes=max_minutes,
            limit=limit
        )
        
        # Format response
        concept_list = [
            {
                "id": str(c.id),
                "title": c.title,
                "summary": c.summary,
                "difficulty": c.difficulty,
                "estimated_minutes": c.estimated_minutes,
                "material_id": c.material_id,
                "created_at": c.created_at.isoformat()
            }
            for c in recommendations
        ]
        
        return {
            "success": True,
            "recommendations": concept_list,
            "count": len(concept_list),
            "filters": {
                "difficulty": difficulty,
                "max_minutes": max_minutes
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )
