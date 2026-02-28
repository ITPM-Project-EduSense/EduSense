"""
EduSense - Smart Task Priority Calculator (FR-2)

This service uses a rule-based AI approach to calculate priority scores
for academic tasks. The algorithm considers multiple weighted factors:

1. Deadline Proximity  (40% weight) - How soon is the deadline?
2. Task Difficulty      (25% weight) - How hard is the task?
3. Current Status       (20% weight) - Is it started or still pending?
4. Overdue Penalty      (15% weight) - Is the task already past due?

Priority Score Range: 0.0 (lowest) to 10.0 (highest/most urgent)

Priority Levels:
  - Critical : 8.0 - 10.0 (immediate attention needed)
  - High     : 6.0 - 7.9  (should be worked on soon)
  - Medium   : 4.0 - 5.9  (can be scheduled normally)
  - Low      : 0.0 - 3.9  (no rush)
"""

from datetime import datetime, timezone
from app.models.task import Task


# ─── Weight Configuration ───
WEIGHT_DEADLINE = 0.40
WEIGHT_DIFFICULTY = 0.25
WEIGHT_STATUS = 0.20
WEIGHT_OVERDUE = 0.15


def calculate_deadline_score(deadline: datetime) -> float:
    """
    Calculate urgency based on how close the deadline is.

    Scoring:
      - Overdue          → 10.0
      - Due today        → 9.5
      - 1 day left       → 9.0
      - 2 days left      → 8.0
      - 3 days left      → 7.0
      - 4-5 days         → 6.0
      - 6-7 days (1 week)→ 5.0
      - 1-2 weeks        → 3.5
      - 2-3 weeks        → 2.0
      - 3+ weeks         → 1.0
    """
    now = datetime.now(timezone.utc)

    # Make deadline timezone-aware if it's not
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    days_remaining = (deadline - now).total_seconds() / (60 * 60 * 24)

    if days_remaining < 0:
        return 10.0  # Overdue
    elif days_remaining < 0.5:
        return 9.5   # Due today
    elif days_remaining < 1:
        return 9.0
    elif days_remaining < 2:
        return 8.0
    elif days_remaining < 3:
        return 7.0
    elif days_remaining < 5:
        return 6.0
    elif days_remaining < 7:
        return 5.0
    elif days_remaining < 14:
        return 3.5
    elif days_remaining < 21:
        return 2.0
    else:
        return 1.0


def calculate_difficulty_score(difficulty: str) -> float:
    """
    Score based on task difficulty level.

    Harder tasks need more attention and planning time.
      - hard   → 9.0
      - medium → 5.5
      - easy   → 2.5
    """
    difficulty_map = {
        "hard": 9.0,
        "medium": 5.5,
        "easy": 2.5,
    }
    return difficulty_map.get(difficulty.lower(), 5.0)


def calculate_status_score(status: str) -> float:
    """
    Score based on current task status.

    Pending tasks that haven't been started get higher urgency.
      - pending     → 8.0 (hasn't been touched yet)
      - in_progress → 4.0 (already being worked on)
      - completed   → 0.0 (done, no priority needed)
    """
    status_map = {
        "pending": 8.0,
        "in_progress": 4.0,
        "completed": 0.0,
    }
    return status_map.get(status.lower(), 5.0)


def calculate_overdue_penalty(deadline: datetime, status: str) -> float:
    """
    Extra penalty for tasks that are overdue and not completed.

    An overdue incomplete task is the most critical situation.
      - Overdue + pending      → 10.0
      - Overdue + in_progress  → 8.0
      - Not overdue            → 0.0
      - Completed              → 0.0
    """
    if status == "completed":
        return 0.0

    now = datetime.now(timezone.utc)

    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    if deadline < now:
        if status == "pending":
            return 10.0
        elif status == "in_progress":
            return 8.0
    return 0.0


def calculate_priority_score(task: Task) -> float:
    """
    Main priority calculation function.

    Combines all weighted factors into a final score (0.0 - 10.0).
    """
    deadline_score = calculate_deadline_score(task.deadline)
    difficulty_score = calculate_difficulty_score(task.difficulty)
    status_score = calculate_status_score(task.status)
    overdue_score = calculate_overdue_penalty(task.deadline, task.status)

    # Weighted sum
    raw_score = (
        (deadline_score * WEIGHT_DEADLINE) +
        (difficulty_score * WEIGHT_DIFFICULTY) +
        (status_score * WEIGHT_STATUS) +
        (overdue_score * WEIGHT_OVERDUE)
    )

    # Clamp to 0.0 - 10.0 and round to 1 decimal
    final_score = round(min(max(raw_score, 0.0), 10.0), 1)

    return final_score


def get_priority_label(score: float) -> str:
    """Convert a numeric priority score to a human-readable label."""
    if score >= 8.0:
        return "critical"
    elif score >= 6.0:
        return "high"
    elif score >= 4.0:
        return "medium"
    else:
        return "low"


def get_priority_breakdown(task: Task) -> dict:
    """
    Get a detailed breakdown of how the priority score was calculated.
    Useful for the "explainable AI" requirement.
    """
    deadline_score = calculate_deadline_score(task.deadline)
    difficulty_score = calculate_difficulty_score(task.difficulty)
    status_score = calculate_status_score(task.status)
    overdue_score = calculate_overdue_penalty(task.deadline, task.status)
    final_score = calculate_priority_score(task)

    now = datetime.now(timezone.utc)
    deadline = task.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    days_remaining = round((deadline - now).total_seconds() / (60 * 60 * 24), 1)

    return {
        "final_score": final_score,
        "priority_label": get_priority_label(final_score),
        "days_remaining": days_remaining,
        "breakdown": {
            "deadline_proximity": {
                "score": deadline_score,
                "weight": WEIGHT_DEADLINE,
                "weighted_score": round(deadline_score * WEIGHT_DEADLINE, 2),
                "reason": f"{'Overdue!' if days_remaining < 0 else f'{days_remaining} days remaining'}"
            },
            "difficulty": {
                "score": difficulty_score,
                "weight": WEIGHT_DIFFICULTY,
                "weighted_score": round(difficulty_score * WEIGHT_DIFFICULTY, 2),
                "reason": f"Task difficulty is {task.difficulty}"
            },
            "status": {
                "score": status_score,
                "weight": WEIGHT_STATUS,
                "weighted_score": round(status_score * WEIGHT_STATUS, 2),
                "reason": f"Task is {task.status.replace('_', ' ')}"
            },
            "overdue_penalty": {
                "score": overdue_score,
                "weight": WEIGHT_OVERDUE,
                "weighted_score": round(overdue_score * WEIGHT_OVERDUE, 2),
                "reason": "Overdue and not completed" if overdue_score > 0 else "Not overdue or completed"
            },
        },
        "suggestion": _generate_suggestion(final_score, days_remaining, task.difficulty, task.status)
    }


def _generate_suggestion(score: float, days_remaining: float, difficulty: str, status: str) -> str:
    """Generate a helpful AI suggestion based on the priority analysis."""
    if score >= 8.0:
        if days_remaining < 0:
            return "⚠️ This task is overdue! Focus on completing it immediately or contact your instructor about an extension."
        return "🔴 Critical priority! Start working on this task right away. Consider blocking dedicated time today."
    elif score >= 6.0:
        if difficulty == "hard":
            return "🟠 This is a high-priority, challenging task. Break it into smaller subtasks and start with the most complex part."
        return "🟠 High priority. Schedule focused study time within the next 1-2 days."
    elif score >= 4.0:
        if status == "pending":
            return "🟡 Medium priority but not yet started. Plan to begin this task soon to avoid last-minute stress."
        return "🟡 On track! Continue working on this at a steady pace."
    else:
        return "🟢 Low priority. You have plenty of time, but consider starting early to spread out your workload."