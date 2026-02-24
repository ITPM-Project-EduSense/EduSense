"""
EduSense - AI Study Schedule Generator (FR-3)

Uses Google Gemini AI to:
1. Analyze extracted course material text
2. Identify key topics and concepts
3. Generate an optimal study schedule distributed across available days
4. Provide study tips and focus recommendations
"""

import json
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import google.generativeai as genai
from app.core.config import settings


# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash-lite")


async def generate_study_schedule(
    extracted_text: str,
    subject: str,
    deadline: datetime,
    title: str = "",
    task_id: Optional[str] = None,
) -> dict:
    """
    Use Gemini AI to analyze course material and generate a study schedule.

    Returns a structured schedule with daily sessions, topics, and tips.
    """
    # Calculate available days
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    days_available = max(1, (deadline - now).days)

    # Build the prompt
    prompt = f"""You are an expert academic study planner AI for university students.

TASK: Analyze the following course material and create a detailed, optimized study schedule.

SUBJECT: {subject}
TITLE: {title}
DEADLINE: {deadline.strftime('%Y-%m-%d')}
DAYS AVAILABLE: {days_available} days (from {now.strftime('%Y-%m-%d')} to {deadline.strftime('%Y-%m-%d')})

COURSE MATERIAL CONTENT:
---
{extracted_text}
---

INSTRUCTIONS:
1. Extract the key topics/chapters from the course material
2. Create a study schedule that distributes these topics across the available days
3. Prioritize harder/more important topics earlier
4. Include rest days if schedule is longer than 7 days
5. Vary focus levels (high for complex topics, medium for review, low for light reading)
6. Each session should be 1-3 hours

RESPOND WITH ONLY VALID JSON (no markdown, no code blocks, no extra text):
{{
  "extracted_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "ai_summary": "A 2-3 sentence overview of the study plan",
  "ai_tips": "3-4 general study tips specific to this subject",
  "sessions": [
    {{
      "day": 1,
      "date": "{now.strftime('%Y-%m-%d')}",
      "day_name": "{now.strftime('%A')}",
      "topics": ["Topic to study"],
      "duration_hours": 2.0,
      "focus_level": "high",
      "tips": "Specific tip for this session"
    }}
  ]
}}

RULES:
- Distribute ALL extracted topics across the sessions
- Each session can have 1-3 topics
- duration_hours should be between 0.5 and 3.0
- focus_level must be "low", "medium", or "high"
- Generate sessions for each day from today until the deadline
- Use actual dates and day names
- Make tips actionable and specific to the content
"""

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        response_text = response_text.strip()

        schedule_data = json.loads(response_text)

        # Calculate totals
        total_topics = len(schedule_data.get("extracted_topics", []))
        total_days = len(schedule_data.get("sessions", []))
        total_hours = sum(s.get("duration_hours", 0) for s in schedule_data.get("sessions", []))

        return {
            "success": True,
            "task_id": task_id,
            "title": title or f"{subject} Study Plan",
            "subject": subject,
            "deadline": deadline.isoformat(),
            "total_topics": total_topics,
            "total_days": total_days,
            "total_hours": round(total_hours, 1),
            "extracted_topics": schedule_data.get("extracted_topics", []),
            "sessions": schedule_data.get("sessions", []),
            "ai_summary": schedule_data.get("ai_summary", ""),
            "ai_tips": schedule_data.get("ai_tips", ""),
        }

    except json.JSONDecodeError as e:
        # If AI response isn't valid JSON, create a fallback schedule
        return await _generate_fallback_schedule(
            subject, deadline, days_available, title, task_id, str(e)
        )
    except Exception as e:
        return {
            "success": False,
            "error": f"AI generation failed: {str(e)}",
        }


async def _generate_fallback_schedule(
    subject: str,
    deadline: datetime,
    days_available: int,
    title: str,
    task_id: Optional[str],
    error_msg: str,
) -> dict:
    """Generate a basic schedule if AI response parsing fails."""
    now = datetime.now(timezone.utc)
    sessions = []

    for i in range(min(days_available, 14)):
        session_date = now + timedelta(days=i)
        sessions.append({
            "day": i + 1,
            "date": session_date.strftime('%Y-%m-%d'),
            "day_name": session_date.strftime('%A'),
            "topics": [f"{subject} - Study Session {i + 1}"],
            "duration_hours": 2.0,
            "focus_level": "high" if i < 3 else "medium" if i < 7 else "low",
            "tips": f"Review {subject} materials and take notes.",
        })

    return {
        "success": True,
        "task_id": task_id,
        "title": title or f"{subject} Study Plan",
        "subject": subject,
        "deadline": deadline.isoformat(),
        "total_topics": 1,
        "total_days": len(sessions),
        "total_hours": len(sessions) * 2.0,
        "extracted_topics": [f"{subject} - General Review"],
        "sessions": sessions,
        "ai_summary": f"A {len(sessions)}-day study plan for {subject}. (AI parsing had an issue, using structured fallback schedule.)",
        "ai_tips": "Break your study sessions into focused blocks. Use active recall and spaced repetition for better retention.",
        "_fallback_reason": error_msg,
    }