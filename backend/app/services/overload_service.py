"""
EduSense - Overload Risk Detection Service (FR-4)

Analyzes a student's upcoming tasks and detects potential overload situations:

1. Too many tasks due in the same time window
2. Multiple hard-difficulty tasks overlapping
3. High total workload in a single week
4. Consecutive deadlines with no breaks

Risk Score Range: 0.0 (no risk) to 10.0 (critical overload)

Risk Levels:
  - Critical : 8.0 - 10.0 (burnout danger, immediate action needed)
  - High     : 6.0 - 7.9  (heavy workload, consider rescheduling)
  - Moderate : 4.0 - 5.9  (manageable but watch closely)
  - Low      : 0.0 - 3.9  (comfortable workload)
"""

from datetime import datetime, timezone, timedelta
from typing import List
from app.models.task import Task


# ─── Risk Weights ───
WEIGHT_TASK_DENSITY = 0.30      # How many tasks in a short period
WEIGHT_DIFFICULTY_CLUSTER = 0.30 # Multiple hard tasks overlapping
WEIGHT_WEEKLY_LOAD = 0.25       # Total tasks in the coming week
WEIGHT_DEADLINE_SPACING = 0.15  # Are deadlines too close together


def _get_active_tasks(tasks: List[Task]) -> List[Task]:
    """Filter to only non-completed tasks with future or recent deadlines."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=1)  # Include tasks due yesterday (just overdue)

    active = []
    for task in tasks:
        if task.status == "completed":
            continue
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline >= cutoff:
            active.append(task)
    return active


def _calculate_task_density_score(tasks: List[Task]) -> dict:
    """
    Check how many tasks are due within a 3-day window.
    
    Scoring:
      - 5+ tasks in 3 days  → 10.0
      - 4 tasks in 3 days   → 8.0
      - 3 tasks in 3 days   → 6.0
      - 2 tasks in 3 days   → 3.0
      - 0-1 tasks           → 0.0
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=3)

    tasks_in_window = []
    for task in tasks:
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now <= deadline <= window_end:
            tasks_in_window.append(task)

    count = len(tasks_in_window)
    task_names = [t.title for t in tasks_in_window]

    if count >= 5:
        score = 10.0
    elif count >= 4:
        score = 8.0
    elif count >= 3:
        score = 6.0
    elif count >= 2:
        score = 3.0
    else:
        score = 0.0

    return {
        "score": score,
        "count": count,
        "tasks": task_names,
        "reason": f"{count} task{'s' if count != 1 else ''} due within the next 3 days"
    }


def _calculate_difficulty_cluster_score(tasks: List[Task]) -> dict:
    """
    Check for multiple hard-difficulty tasks in the next 7 days.
    
    Scoring:
      - 4+ hard tasks in 7 days → 10.0
      - 3 hard tasks             → 8.0
      - 2 hard tasks             → 5.0
      - 1 hard task              → 2.0
      - 0 hard tasks             → 0.0
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=7)

    hard_tasks = []
    for task in tasks:
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if task.difficulty == "hard" and now <= deadline <= window_end:
            hard_tasks.append(task)

    count = len(hard_tasks)
    task_names = [t.title for t in hard_tasks]

    if count >= 4:
        score = 10.0
    elif count >= 3:
        score = 8.0
    elif count >= 2:
        score = 5.0
    elif count >= 1:
        score = 2.0
    else:
        score = 0.0

    return {
        "score": score,
        "count": count,
        "tasks": task_names,
        "reason": f"{count} hard-difficulty task{'s' if count != 1 else ''} in the next 7 days"
    }


def _calculate_weekly_load_score(tasks: List[Task]) -> dict:
    """
    Check total task count for the coming week.
    
    Scoring:
      - 8+ tasks → 10.0
      - 6-7 tasks → 7.0
      - 4-5 tasks → 4.0
      - 2-3 tasks → 2.0
      - 0-1 tasks → 0.0
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=7)

    weekly_tasks = []
    for task in tasks:
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now <= deadline <= window_end:
            weekly_tasks.append(task)

    count = len(weekly_tasks)

    if count >= 8:
        score = 10.0
    elif count >= 6:
        score = 7.0
    elif count >= 4:
        score = 4.0
    elif count >= 2:
        score = 2.0
    else:
        score = 0.0

    return {
        "score": score,
        "count": count,
        "reason": f"{count} total task{'s' if count != 1 else ''} due this week"
    }


def _calculate_deadline_spacing_score(tasks: List[Task]) -> dict:
    """
    Check if deadlines are bunched together with no breathing room.
    
    Looks at gaps between consecutive deadlines in the next 7 days.
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=7)

    upcoming_deadlines = []
    for task in tasks:
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now <= deadline <= window_end:
            upcoming_deadlines.append(deadline)

    if len(upcoming_deadlines) < 2:
        return {
            "score": 0.0,
            "min_gap_hours": None,
            "reason": "Deadlines are well-spaced"
        }

    upcoming_deadlines.sort()

    # Calculate gaps between consecutive deadlines
    gaps = []
    for i in range(1, len(upcoming_deadlines)):
        gap_hours = (upcoming_deadlines[i] - upcoming_deadlines[i - 1]).total_seconds() / 3600
        gaps.append(gap_hours)

    min_gap = min(gaps) if gaps else 999
    avg_gap = sum(gaps) / len(gaps) if gaps else 999

    # Score based on minimum gap
    if min_gap < 6:
        score = 10.0
    elif min_gap < 12:
        score = 8.0
    elif min_gap < 24:
        score = 5.0
    elif min_gap < 48:
        score = 3.0
    else:
        score = 0.0

    return {
        "score": score,
        "min_gap_hours": round(min_gap, 1),
        "avg_gap_hours": round(avg_gap, 1),
        "reason": f"Minimum {round(min_gap, 1)}h gap between deadlines"
    }


def detect_overload_risk(tasks: List[Task]) -> dict:
    """
    Main overload detection function.
    
    Analyzes all active tasks and returns a comprehensive risk assessment.
    """
    active_tasks = _get_active_tasks(tasks)

    # Calculate each factor
    density = _calculate_task_density_score(active_tasks)
    difficulty = _calculate_difficulty_cluster_score(active_tasks)
    weekly = _calculate_weekly_load_score(active_tasks)
    spacing = _calculate_deadline_spacing_score(active_tasks)

    # Weighted final score
    raw_score = (
        (density["score"] * WEIGHT_TASK_DENSITY) +
        (difficulty["score"] * WEIGHT_DIFFICULTY_CLUSTER) +
        (weekly["score"] * WEIGHT_WEEKLY_LOAD) +
        (spacing["score"] * WEIGHT_DEADLINE_SPACING)
    )

    final_score = round(min(max(raw_score, 0.0), 10.0), 1)

    # Determine risk level
    if final_score >= 8.0:
        risk_level = "critical"
    elif final_score >= 6.0:
        risk_level = "high"
    elif final_score >= 4.0:
        risk_level = "moderate"
    else:
        risk_level = "low"

    # Generate warnings
    warnings = []
    if density["score"] >= 6.0:
        warnings.append({
            "type": "task_density",
            "severity": "high" if density["score"] >= 8.0 else "medium",
            "message": f"⚠️ {density['count']} tasks due in the next 3 days — consider rescheduling or prioritizing.",
            "tasks": density.get("tasks", []),
        })
    if difficulty["score"] >= 5.0:
        warnings.append({
            "type": "difficulty_cluster",
            "severity": "high" if difficulty["score"] >= 8.0 else "medium",
            "message": f"🔴 {difficulty['count']} hard tasks this week — break them into smaller subtasks.",
            "tasks": difficulty.get("tasks", []),
        })
    if weekly["score"] >= 4.0:
        warnings.append({
            "type": "weekly_overload",
            "severity": "high" if weekly["score"] >= 7.0 else "medium",
            "message": f"📋 {weekly['count']} tasks due this week — plan dedicated focus blocks.",
        })
    if spacing["score"] >= 5.0:
        warnings.append({
            "type": "tight_deadlines",
            "severity": "high" if spacing["score"] >= 8.0 else "medium",
            "message": f"⏰ Only {spacing.get('min_gap_hours', '?')}h between some deadlines — very little buffer time.",
        })

    # Generate suggestion
    suggestion = _generate_overload_suggestion(final_score, risk_level, density, difficulty, weekly)

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "active_tasks": len(active_tasks),
        "warnings": warnings,
        "suggestion": suggestion,
        "breakdown": {
            "task_density": {
                "score": density["score"],
                "weight": WEIGHT_TASK_DENSITY,
                "weighted_score": round(density["score"] * WEIGHT_TASK_DENSITY, 2),
                **density,
            },
            "difficulty_cluster": {
                "score": difficulty["score"],
                "weight": WEIGHT_DIFFICULTY_CLUSTER,
                "weighted_score": round(difficulty["score"] * WEIGHT_DIFFICULTY_CLUSTER, 2),
                **difficulty,
            },
            "weekly_load": {
                "score": weekly["score"],
                "weight": WEIGHT_WEEKLY_LOAD,
                "weighted_score": round(weekly["score"] * WEIGHT_WEEKLY_LOAD, 2),
                **weekly,
            },
            "deadline_spacing": {
                "score": spacing["score"],
                "weight": WEIGHT_DEADLINE_SPACING,
                "weighted_score": round(spacing["score"] * WEIGHT_DEADLINE_SPACING, 2),
                **spacing,
            },
        },
    }


def _generate_overload_suggestion(
    score: float,
    risk_level: str,
    density: dict,
    difficulty: dict,
    weekly: dict,
) -> str:
    """Generate actionable suggestion based on overload analysis."""
    if score >= 8.0:
        return (
            "🚨 CRITICAL OVERLOAD DETECTED! You have too many demanding tasks in a short period. "
            "Immediate actions: (1) Identify which tasks can be started today, "
            "(2) Contact instructors if extensions are possible, "
            "(3) Focus on high-priority tasks first and defer low-priority ones."
        )
    elif score >= 6.0:
        return (
            "⚠️ High workload detected. You're at risk of falling behind. "
            "Suggestion: Block 2-3 hour focused study sessions for your hardest tasks. "
            "Consider starting tasks earlier than planned to build buffer time."
        )
    elif score >= 4.0:
        return (
            "📊 Moderate workload this week. It's manageable but requires discipline. "
            "Tip: Create a daily schedule and tackle the most challenging task during your peak energy hours."
        )
    else:
        return (
            "✅ Your workload looks comfortable! Great job keeping things balanced. "
            "Use this time to get ahead on upcoming tasks or review completed work."
        )