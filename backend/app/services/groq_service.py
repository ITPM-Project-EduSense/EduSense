"""
EduSense - Groq AI Service (Llama 3.3)
Replaces Gemini for schedule generation and document summarization.
Uses Groq's free tier with llama-3.3-70b-versatile model.
"""

import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any

from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"


def _clean_json(text: str) -> str:
    """Strip markdown code fences and extract raw JSON from Groq response."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_json_safe(text: str, fallback: Any = None) -> Any:
    """Parse JSON with fallback on error."""
    try:
        return json.loads(_clean_json(text))
    except (json.JSONDecodeError, ValueError):
        # Try to find JSON block inside the text
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass
        return fallback


def summarize_document(text: str, subject: str, filename: str) -> Dict[str, Any]:
    """
    Summarize a single study document using Groq / Llama 3.3.

    Returns:
        {
            "summary": "2-3 sentence summary",
            "key_points": ["point 1", ...],
            "topics": ["Topic A", "Topic B", ...]
        }
    """
    # Truncate per-document text to avoid token overflow
    truncated = text[:6000] if len(text) > 6000 else text

    prompt = f"""You are an expert academic assistant. Analyze this study material for "{subject}" and produce a concise summary.

Document filename: {filename}

--- CONTENT START ---
{truncated}
--- CONTENT END ---

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
  "summary": "A 2-3 sentence overview of what this document covers",
  "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "topics": ["Main Topic A", "Main Topic B", "Main Topic C"]
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.2,
        )
        raw = response.choices[0].message.content
        result = _parse_json_safe(raw)
        if result and isinstance(result, dict):
            return {
                "summary": result.get("summary", ""),
                "key_points": result.get("key_points", [])[:6],
                "topics": result.get("topics", [])[:6],
            }
    except Exception as e:
        print(f"[groq_service] summarize_document error for {filename}: {e}")

    return {
        "summary": f"Content from {filename} related to {subject}.",
        "key_points": ["Review this document for key concepts"],
        "topics": [subject],
    }


def generate_smart_schedule(
    documents_data: List[Dict[str, str]],
    subject: str,
    title: str,
    deadline: datetime,
    task_created_at: datetime,
) -> Dict[str, Any]:
    """
    Generate a full AI-powered study schedule using Groq / Llama 3.3.

    Args:
        documents_data: List of {"filename": str, "text": str}
        subject: Course/subject name
        title: Task title
        deadline: Task deadline (datetime)
        task_created_at: When the task was created (datetime)

    Returns full schedule dict including sessions, document_summaries, topics, tips.
    """
    # ── 1. Calculate date window ──────────────────────────────────────────
    today = datetime.utcnow().date()
    start_date = max(task_created_at.date(), today)
    end_date = deadline.date()

    if end_date <= start_date:
        end_date = start_date + timedelta(days=1)

    total_days = (end_date - start_date).days
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    # ── 2. Per-document summaries ─────────────────────────────────────────
    document_summaries: List[Dict[str, Any]] = []
    combined_texts: List[str] = []
    all_topics: List[str] = []

    for doc in documents_data:
        fname = doc.get("filename", "document")
        text = doc.get("text", "")
        summary_obj = summarize_document(text, subject, fname)
        document_summaries.append({
            "filename": fname,
            "summary": summary_obj["summary"],
            "key_points": summary_obj["key_points"],
            "topics": summary_obj["topics"],
        })
        all_topics.extend(summary_obj["topics"])
        combined_texts.append(f"=== {fname} ===\n{text[:4000]}")

    combined_content = "\n\n".join(combined_texts)[:12000] if combined_texts else ""
    unique_topics = list(dict.fromkeys(all_topics))  # deduplicate, preserve order

    # ── 3. Build schedule prompt ──────────────────────────────────────────
    has_docs = bool(combined_content.strip())
    material_section = (
        f"STUDY MATERIAL CONTENT:\n{combined_content}"
        if has_docs
        else f"No documents uploaded. Generate a general study plan for {subject}."
    )

    prompt = f"""You are an expert academic study planner. Create a detailed day-by-day study schedule.

TASK: {title}
SUBJECT: {subject}
STUDY PERIOD: {start_str} to {end_str} (ONLY these dates — do NOT go outside this range)
TOTAL DAYS AVAILABLE: {total_days}

{material_section}

Generate a complete study schedule. Return ONLY a valid JSON object (no markdown, no extra text):
{{
  "extracted_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "ai_summary": "2-3 sentence overview of the study plan and approach",
  "ai_tips": ["Study tip 1", "Study tip 2", "Study tip 3", "Study tip 4"],
  "sessions": [
    {{
      "day": 1,
      "date": "{start_str}",
      "day_name": "Monday",
      "topics": ["Topic for this day"],
      "duration_hours": 2.0,
      "focus_level": "high",
      "tips": "Specific actionable tip for this session"
    }}
  ]
}}

STRICT RULES:
1. All "date" values MUST be between {start_str} and {end_str} INCLUSIVE
2. "focus_level" must be exactly "low", "medium", or "high"
3. "duration_hours" must be a number between 0.5 and 4.0
4. "day" starts at 1 and increments for each session
5. Spread topics evenly — don't front-load or back-load all content
6. Generate {min(total_days, 10)} sessions maximum, distributed across the date range
7. Return ONLY valid JSON — no markdown fences, no explanation text"""

    # ── 4. Call Groq ──────────────────────────────────────────────────────
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.3,
        )
        raw = response.choices[0].message.content
        result = _parse_json_safe(raw)

        if result and isinstance(result, dict) and result.get("sessions"):
            # Validate + clamp session dates to the allowed window
            sessions = []
            for i, s in enumerate(result["sessions"]):
                sdate = s.get("date", start_str)
                if sdate < start_str or sdate > end_str:
                    sdate = start_str  # Clamp out-of-range dates
                sessions.append({
                    "day": s.get("day", i + 1),
                    "date": sdate,
                    "day_name": s.get("day_name", _day_name(sdate)),
                    "topics": s.get("topics", [subject]),
                    "duration_hours": float(s.get("duration_hours", 2.0)),
                    "focus_level": s.get("focus_level", "medium"),
                    "tips": s.get("tips", "Stay focused and take short breaks."),
                })

            extracted_topics = (
                result.get("extracted_topics")
                or unique_topics
                or [subject]
            )

            return {
                "success": True,
                "extracted_topics": extracted_topics[:15],
                "ai_summary": result.get("ai_summary", f"Study plan for {title}"),
                "ai_tips": result.get("ai_tips", [])[:6],
                "document_summaries": document_summaries,
                "sessions": sessions,
            }

    except Exception as e:
        print(f"[groq_service] generate_smart_schedule error: {e}")

    # ── 5. Fallback schedule if AI fails ──────────────────────────────────
    return _fallback_schedule(
        subject=subject,
        title=title,
        start_date=start_date,
        end_date=end_date,
        topics=unique_topics or [subject],
        document_summaries=document_summaries,
    )


def _day_name(date_str: str) -> str:
    """Return weekday name for a YYYY-MM-DD string."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%A")
    except ValueError:
        return "Day"


def _fallback_schedule(
    subject: str,
    title: str,
    start_date,
    end_date,
    topics: List[str],
    document_summaries: List[Dict],
) -> Dict[str, Any]:
    """Generate a deterministic fallback schedule when Groq fails."""
    total_days = (end_date - start_date).days or 1
    num_sessions = min(total_days, 7)
    sessions = []
    focus_cycle = ["high", "medium", "high", "medium", "low", "high", "medium"]

    for i in range(num_sessions):
        session_date = start_date + timedelta(days=int(i * (total_days / num_sessions)))
        topic_idx = i % len(topics) if topics else 0
        sessions.append({
            "day": i + 1,
            "date": session_date.isoformat(),
            "day_name": session_date.strftime("%A"),
            "topics": [topics[topic_idx]] if topics else [subject],
            "duration_hours": 2.0,
            "focus_level": focus_cycle[i % len(focus_cycle)],
            "tips": f"Session {i+1}: Focus on understanding the core concepts before moving on.",
        })

    return {
        "success": True,
        "extracted_topics": topics[:10] or [subject],
        "ai_summary": f"Study plan for {title} covering {subject} over {total_days} days.",
        "ai_tips": [
            "Review material before each session",
            "Take 10-minute breaks every hour",
            "Use active recall techniques",
            "Summarise key points after each session",
        ],
        "document_summaries": document_summaries,
        "sessions": sessions,
    }
