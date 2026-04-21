from datetime import datetime
from typing import Any, Dict, Set
from urllib.parse import quote

from app.models.study_material import StudyMaterial
from app.models.study_schedule import StudySchedule, SmartSchedule
from app.models.task import Task


def _build_task_routes(task: Task) -> Dict[str, str]:
    subject = quote(task.subject)
    task_id = str(task.id)
    return {
        "planner_route": f"/planner?task_id={task_id}",
        "collaboration_route": f"/materials?module={subject}&task_id={task_id}",
        "coach_route": f"/ai?subject={subject}&task_id={task_id}",
        "analytics_route": f"/analytics?task_id={task_id}",
    }


def derive_task_workflow(
    task: Task,
    has_materials: bool,
    has_schedule: bool,
    now: datetime | None = None,
) -> Dict[str, Any]:
    """Derive a consistent workflow state and next action for a task."""
    current_time = now or datetime.utcnow()
    is_overdue = task.deadline < current_time and task.status != "completed"
    routes = _build_task_routes(task)

    if task.status == "completed":
        stage = "completed"
        next_action = "Review analytics and lock in lessons learned"
        recommended_route = routes["analytics_route"]
        progress_pct = 100
    elif is_overdue:
        stage = "at_risk"
        next_action = "Regenerate your study plan, get AI coaching, and recover this task with a smaller focus block"
        recommended_route = routes["planner_route"]
        progress_pct = 20 if has_schedule else 10
    elif task.status == "in_progress":
        stage = "in_progress"
        next_action = "Use the AI productivity coach for your next study block and keep your plan moving"
        recommended_route = routes["coach_route"]
        progress_pct = 75 if has_schedule else 60
    elif has_schedule:
        stage = "planned"
        next_action = "Open PeerConnect for this module, then start the first scheduled study session"
        recommended_route = routes["collaboration_route"]
        progress_pct = 60
    elif has_materials:
        stage = "material_ready"
        next_action = "Generate a study plan from your uploaded materials"
        recommended_route = routes["planner_route"]
        progress_pct = 40
    else:
        stage = "draft"
        next_action = "Upload study material to unlock AI planning"
        recommended_route = "/materials"
        progress_pct = 20

    return {
        "stage": stage,
        "next_action": next_action,
        "recommended_route": recommended_route,
        "has_materials": has_materials,
        "has_schedule": has_schedule,
        "is_overdue": is_overdue,
        "progress_pct": progress_pct,
        **routes,
    }


async def get_task_workflow(task: Task) -> Dict[str, Any]:
    """Fetch material/schedule signals and derive workflow for a single task."""
    has_materials = bool(
        await StudyMaterial.find_one(
            StudyMaterial.user_id == task.user_id,
            StudyMaterial.subject == task.subject,
        )
    )
    has_schedule = bool(
        await StudySchedule.find_one(
            StudySchedule.user_id == task.user_id,
            StudySchedule.task_id == str(task.id),
        )
    ) or bool(
        await SmartSchedule.find_one(
            SmartSchedule.user_id == task.user_id,
            SmartSchedule.task_id == str(task.id),
        )
    )
    return derive_task_workflow(task, has_materials=has_materials, has_schedule=has_schedule)


async def get_user_workflow_overview(user_id: str) -> Dict[str, Any]:
    """Return workflow distribution and task-level hints for dashboard orchestration."""
    tasks = await Task.find(Task.user_id == user_id).to_list()

    materials = await StudyMaterial.find(StudyMaterial.user_id == user_id).to_list()
    subjects_with_materials: Set[str] = {m.subject for m in materials}

    rule_schedules = await StudySchedule.find(StudySchedule.user_id == user_id).to_list()
    smart_schedules = await SmartSchedule.find(SmartSchedule.user_id == user_id).to_list()
    scheduled_task_ids: Set[str] = {
        s.task_id for s in rule_schedules if s.task_id
    } | {
        s.task_id for s in smart_schedules if s.task_id
    }

    stage_counts: Dict[str, int] = {
        "draft": 0,
        "material_ready": 0,
        "planned": 0,
        "in_progress": 0,
        "at_risk": 0,
        "completed": 0,
    }

    workflow_items = []
    for task in tasks:
        workflow = derive_task_workflow(
            task,
            has_materials=task.subject in subjects_with_materials,
            has_schedule=str(task.id) in scheduled_task_ids,
        )
        stage_counts[workflow["stage"]] = stage_counts.get(workflow["stage"], 0) + 1

        workflow_items.append(
            {
                "task_id": str(task.id),
                "title": task.title,
                "subject": task.subject,
                "deadline": task.deadline.isoformat(),
                **workflow,
            }
        )

    workflow_items.sort(
        key=lambda item: (
            item["stage"] == "completed",
            item["deadline"],
        )
    )

    return {
        "total_tasks": len(tasks),
        "stage_counts": stage_counts,
        "tasks": workflow_items,
    }
