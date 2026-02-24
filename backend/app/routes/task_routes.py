from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from app.models.task import Task, TaskCreate, TaskUpdate, TaskResponse

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
async def create_task(task_data: TaskCreate):
    """Create a new academic task and store it in the database."""
    task = Task(
        title=task_data.title,
        description=task_data.description,
        subject=task_data.subject,
        deadline=task_data.deadline,
        difficulty=task_data.difficulty,
        status=task_data.status,
    )
    await task.insert()
    return task_to_response(task)


# ─── GET /tasks ─── Get all tasks ───
@router.get(
    "/",
    response_model=List[TaskResponse],
    summary="Get all academic tasks",
)
async def get_all_tasks():
    """Retrieve all tasks from the database."""
    tasks = await Task.find_all().to_list()
    return [task_to_response(t) for t in tasks]


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
    return task_to_response(task)


# ─── PUT /tasks/{task_id} ─── Update a task ───
@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update an existing task",
)
async def update_task(task_id: str, task_data: TaskUpdate):
    """Update an existing task with the provided fields."""
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

    # Refresh the task from DB
    task = await Task.get(PydanticObjectId(task_id))
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