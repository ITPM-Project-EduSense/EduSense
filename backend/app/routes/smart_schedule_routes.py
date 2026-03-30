from typing import List

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.smart_scheduling import (
    RegeneratePlanRequest,
    StudyPlan,
    StudyPlanOut,
    StudySession,
    StudySessionOut,
    TaskResource,
    TaskResourceCreate,
)
from app.models.task import Task
from app.models.user_model import User
from app.services.smart_scheduler import SmartScheduler

router = APIRouter(prefix="/tasks", tags=["Smart Scheduling"])


async def _get_task_or_404(task_id: str, current_user: User) -> Task:
    try:
        object_id = PydanticObjectId(task_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task id format",
        ) from exc

    task = await Task.get(object_id)
    if not task or task.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


def _to_plan_out(plan: StudyPlan, sessions: List[StudySession]) -> StudyPlanOut:
    return StudyPlanOut(
        plan_id=str(plan.id),
        task_id=plan.task_id,
        total_hours=plan.total_hours,
        created_at=plan.created_at,
        sessions=[
            StudySessionOut(
                id=str(s.id),
                session_type=s.session_type,
                duration_minutes=s.duration_minutes,
                scheduled_day=s.scheduled_day,
            )
            for s in sorted(sessions, key=lambda x: (x.scheduled_day, x.session_type))
        ],
    )


@router.post(
    "/{task_id}/resources",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Attach study material metadata to a task",
)
async def attach_resource(
    task_id: str,
    payload: TaskResourceCreate,
    current_user: User = Depends(get_current_user),
):
    """Step 2: Attach resources after task creation and before plan generation."""
    task = await _get_task_or_404(task_id, current_user)

    resource = TaskResource(
        task_id=str(task.id),
        file_name=payload.file_name,
        file_type=payload.file_type,
        content_length=payload.content_length,
    )
    await resource.insert()

    return {
        "message": "Resource attached successfully",
        "resource_id": str(resource.id),
        "task_id": str(task.id),
    }


@router.post(
    "/{task_id}/generate-plan",
    response_model=StudyPlanOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generate smart plan from task + attached materials",
)
async def generate_plan(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Step 3/4: Analyze task with resources and generate context-aware sessions."""
    task = await _get_task_or_404(task_id, current_user)

    existing_plan = await StudyPlan.find_one(StudyPlan.task_id == str(task.id))
    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Plan already exists for this task. Use regenerate-plan instead.",
        )

    resources = await TaskResource.find(TaskResource.task_id == str(task.id)).to_list()
    if not resources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attach at least one study material before generating a plan.",
        )

    scheduler = SmartScheduler()
    session_drafts, total_hours = scheduler.build_plan(task=task, resources=resources)

    plan = StudyPlan(task_id=str(task.id), total_hours=total_hours)
    await plan.insert()

    sessions: List[StudySession] = []
    for draft in session_drafts:
        session = StudySession(
            plan_id=str(plan.id),
            task_id=str(task.id),
            session_type=draft.session_type,
            duration_minutes=draft.duration_minutes,
            scheduled_day=draft.scheduled_day,
        )
        await session.insert()
        sessions.append(session)

    return _to_plan_out(plan, sessions)


@router.post(
    "/{task_id}/regenerate-plan",
    response_model=StudyPlanOut,
    summary="Regenerate plan with optional workload constraints",
)
async def regenerate_plan(
    task_id: str,
    payload: RegeneratePlanRequest,
    current_user: User = Depends(get_current_user),
):
    """Step 5: Delete old plan and regenerate with constraints."""
    task = await _get_task_or_404(task_id, current_user)

    resources = await TaskResource.find(TaskResource.task_id == str(task.id)).to_list()
    if not resources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attach at least one study material before regenerating a plan.",
        )

    existing_plans = await StudyPlan.find(StudyPlan.task_id == str(task.id)).to_list()
    for old_plan in existing_plans:
        await StudySession.find(StudySession.plan_id == str(old_plan.id)).delete()
        await old_plan.delete()

    scheduler = SmartScheduler()
    session_drafts, total_hours = scheduler.build_plan(
        task=task,
        resources=resources,
        max_minutes_per_day=payload.max_minutes_per_day or 240,
    )

    plan = StudyPlan(task_id=str(task.id), total_hours=total_hours)
    await plan.insert()

    sessions: List[StudySession] = []
    for draft in session_drafts:
        session = StudySession(
            plan_id=str(plan.id),
            task_id=str(task.id),
            session_type=draft.session_type,
            duration_minutes=draft.duration_minutes,
            scheduled_day=draft.scheduled_day,
        )
        await session.insert()
        sessions.append(session)

    return _to_plan_out(plan, sessions)


@router.get(
    "/{task_id}/plan",
    response_model=StudyPlanOut,
    summary="Get generated study plan sessions for a task",
)
async def get_plan(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Fetch the latest generated plan and its sessions for a task."""
    task = await _get_task_or_404(task_id, current_user)

    plans = await StudyPlan.find(StudyPlan.task_id == str(task.id)).sort("-created_at").to_list()
    if not plans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No plan found for this task")

    latest_plan = plans[0]
    sessions = await StudySession.find(StudySession.plan_id == str(latest_plan.id)).to_list()
    return _to_plan_out(latest_plan, sessions)
