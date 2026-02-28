from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from app.models.task import Task, TaskCreate, TaskUpdate, TaskResponse
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.priority_service import (
    calculate_priority_score,
    get_priority_breakdown,
    get_priority_label,
)
from app.services.overload_service import detect_overload_risk

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def task_to_response(task: Task) -> TaskResponse:
    """Convert a Task document to a TaskResponse schema."""
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        subject=task.subject,
        deadline=task.deadline,
        difficulty=task.difficulty,
        status=task.status,
        priority_score=task.priority_score,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


# ─── POST /tasks ─── Create a new task ───
@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new academic task",
)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    """Create a new academic task with auto-calculated priority."""
    task = Task(
        user_id=str(current_user.id),
        title=task_data.title,
        description=task_data.description,
        subject=task_data.subject,
        deadline=task_data.deadline,
        difficulty=task_data.difficulty,
        status=task_data.status,
    )

    # Auto-calculate priority score
    task.priority_score = calculate_priority_score(task)

    await task.insert()
    return task_to_response(task)


# ─── GET /tasks ─── Get all tasks ───
@router.get(
    "/",
    response_model=List[TaskResponse],
    summary="Get all academic tasks",
)
async def get_all_tasks(current_user: User = Depends(get_current_user)):
    """Retrieve all tasks for the current user with recalculated priority scores."""
    tasks = await Task.find(Task.user_id == str(current_user.id)).to_list()

    # Recalculate priorities (they change as deadlines approach)
    for task in tasks:
        new_score = calculate_priority_score(task)
        if task.priority_score != new_score:
            task.priority_score = new_score
            await task.set({"priority_score": new_score})

    # Sort by priority (highest first)
    tasks.sort(key=lambda t: t.priority_score or 0, reverse=True)

    return [task_to_response(t) for t in tasks]


# ─── GET /tasks/overload-risk ─── Detect overload risk ───
# (Must be BEFORE /{task_id} to avoid route conflict)
@router.get(
    "/overload-risk",
    summary="Detect academic overload risk",
)
async def get_overload_risk(current_user: User = Depends(get_current_user)):
    """
    Analyze all active tasks and detect potential overload situations.
    Returns risk score, warnings, and actionable suggestions.
    """
    tasks = await Task.find(Task.user_id == str(current_user.id)).to_list()
    risk_data = detect_overload_risk(tasks)
    return risk_data


# ─── POST /tasks/recalculate-all ─── Recalculate all priorities ───
@router.post(
    "/recalculate-all",
    summary="Recalculate priorities for all tasks",
)
async def recalculate_all_priorities():
    """Recalculate priority scores for all non-completed tasks."""
    tasks = await Task.find_all().to_list()
    updated_count = 0

    for task in tasks:
        new_score = calculate_priority_score(task)
        if task.priority_score != new_score:
            task.priority_score = new_score
            await task.set({"priority_score": new_score})
            updated_count += 1

    return {
        "message": f"Recalculated priorities for {updated_count} tasks",
        "total_tasks": len(tasks),
        "updated": updated_count,
    }


# ─── GET /tasks/{task_id} ─── Get a single task ───
@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a single task by ID",
)
async def get_task(task_id: str):
    """Retrieve a single task by its ID."""
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )

    # Recalculate priority
    task.priority_score = calculate_priority_score(task)
    await task.set({"priority_score": task.priority_score})

    return task_to_response(task)


# ─── GET /tasks/{task_id}/priority ─── Get priority breakdown ───
@router.get(
    "/{task_id}/priority",
    summary="Get AI priority breakdown for a task",
)
async def get_task_priority(task_id: str):
    """
    Get a detailed AI-powered priority analysis for a task.
    Includes score breakdown, explanation, and suggestions.
    """
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )

    breakdown = get_priority_breakdown(task)

    # Update the stored priority score
    await task.set({"priority_score": breakdown["final_score"]})

    return {
        "task_id": str(task.id),
        "task_title": task.title,
        **breakdown,
    }


# ─── PUT /tasks/{task_id} ─── Update a task ───
@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update an existing task",
)
async def update_task(task_id: str, task_data: TaskUpdate):
    """Update an existing task and recalculate its priority."""
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )

    # Only update fields that were provided (not None)
    update_fields = task_data.model_dump(exclude_none=True)
    if update_fields:
        update_fields["updated_at"] = datetime.utcnow()
        await task.set(update_fields)

    # Refresh and recalculate priority
    task = await Task.get(PydanticObjectId(task_id))
    task.priority_score = calculate_priority_score(task)
    await task.set({"priority_score": task.priority_score})

    return task_to_response(task)


# ─── DELETE /tasks/{task_id} ─── Delete a task ───
@router.delete(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
)
async def delete_task(task_id: str):
    """Delete a task by its ID."""
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    await task.delete()
    return {"message": f"Task '{task.title}' deleted successfully"}