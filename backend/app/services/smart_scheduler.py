from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import ceil
from typing import Dict, List

from app.models.smart_scheduling import TaskResource
from app.models.task import Task


@dataclass
class SessionDraft:
    """Internal session representation before persistence."""

    session_type: str
    duration_minutes: int
    scheduled_day: date


class SmartScheduler:
    """Context-aware scheduler driven by task type and attached materials."""

    MAX_SESSION_MINUTES = 120  # hard rule: no session longer than 2 hours

    def analyze_task(self, task: Task, resources: List[TaskResource]) -> Dict[str, float]:
        """Estimate workload using task effort, difficulty, and material size."""
        difficulty_factor = {"easy": 1.0, "medium": 1.2, "hard": 1.5}.get(task.difficulty, 1.2)
        resource_load = sum(r.content_length for r in resources)

        # Convert material size to hours with a bounded multiplier.
        resource_hours = min(8.0, resource_load * 0.15)
        base_hours = max(1.0, task.estimated_hours) * difficulty_factor
        total_hours = max(1.0, base_hours + resource_hours)

        return {
            "difficulty_factor": difficulty_factor,
            "resource_load": resource_load,
            "resource_hours": resource_hours,
            "total_hours": round(total_hours, 2),
        }

    def choose_strategy(self, task_type: str) -> List[tuple[str, float]]:
        """Return session mix per task type as (session_type, weight)."""
        strategies: Dict[str, List[tuple[str, float]]] = {
            "reading": [("reading", 0.7), ("revision", 0.3)],
            "assignment": [("research", 0.25), ("implementation", 0.55), ("review", 0.2)],
            "exam": [("revision", 0.7), ("practice", 0.3)],
            "coding": [("implementation", 0.25), ("practice", 0.6), ("review", 0.15)],
        }
        return strategies.get(task_type, strategies["reading"])

    def generate_sessions(self, task: Task, resources: List[TaskResource]) -> tuple[List[SessionDraft], float]:
        """Build raw sessions (types + durations) before date placement."""
        analysis = self.analyze_task(task, resources)
        total_minutes = int(round(analysis["total_hours"] * 60))
        strategy = self.choose_strategy(task.task_type)

        session_minutes_by_type: Dict[str, int] = {}
        allocated = 0
        for idx, (session_type, weight) in enumerate(strategy):
            if idx == len(strategy) - 1:
                minutes = total_minutes - allocated
            else:
                minutes = int(total_minutes * weight)
                allocated += minutes
            session_minutes_by_type[session_type] = max(0, minutes)

        drafts: List[SessionDraft] = []
        today = date.today()
        for session_type, minutes in session_minutes_by_type.items():
            remaining = minutes
            while remaining > 0:
                chunk = min(self.MAX_SESSION_MINUTES, remaining)
                chunk = max(30, chunk)
                drafts.append(
                    SessionDraft(
                        session_type=session_type,
                        duration_minutes=chunk,
                        scheduled_day=today,
                    )
                )
                remaining -= chunk

        return drafts, analysis["total_hours"]

    def distribute_sessions(
        self,
        sessions: List[SessionDraft],
        deadline: datetime,
        max_minutes_per_day: int = 240,
    ) -> List[SessionDraft]:
        """Assign session dates from today to deadline while avoiding single-day overload."""
        today = date.today()
        deadline_day = deadline.date()
        if deadline_day < today:
            deadline_day = today

        days_available = (deadline_day - today).days + 1
        calendar_days = [today + timedelta(days=i) for i in range(days_available)]
        if not calendar_days:
            calendar_days = [today]

        day_load: Dict[date, int] = {d: 0 for d in calendar_days}

        # Spread sessions by placing each one on the least loaded day with available capacity.
        for draft in sessions:
            placed = False
            for day in sorted(calendar_days, key=lambda d: day_load[d]):
                if day_load[day] + draft.duration_minutes <= max_minutes_per_day:
                    draft.scheduled_day = day
                    day_load[day] += draft.duration_minutes
                    placed = True
                    break

            # If all days are full relative to cap, place on least loaded day anyway.
            if not placed:
                day = min(calendar_days, key=lambda d: day_load[d])
                draft.scheduled_day = day
                day_load[day] += draft.duration_minutes

        # Spaced revision for exams: push revision sessions to alternating days where possible.
        return sorted(sessions, key=lambda s: (s.scheduled_day, s.session_type))

    def build_plan(
        self,
        task: Task,
        resources: List[TaskResource],
        max_minutes_per_day: int = 240,
    ) -> tuple[List[SessionDraft], float]:
        """End-to-end generation: analyze -> strategy -> sessions -> distribution."""
        sessions, total_hours = self.generate_sessions(task, resources)
        distributed = self.distribute_sessions(
            sessions=sessions,
            deadline=task.deadline,
            max_minutes_per_day=max_minutes_per_day,
        )
        return distributed, total_hours
