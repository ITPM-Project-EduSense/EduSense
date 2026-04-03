"""
================================================================================
EduSense - AI Study Planner Service (Groq + Llama 3.3)
================================================================================

This service powers the Smart Study Planner feature using Groq's free AI API.

SIMPLE FLOW:
============
    1. Student creates a TASK (title, subject, deadline)
    2. Student uploads FILES (PDF/DOCX/PPTX) - optional
    3. This service:
       a) Summarizes each uploaded document
       b) Generates a day-by-day study schedule
       c) Provides AI tips for effective studying
    4. Schedule is saved and displayed to student

MAIN FUNCTIONS (Public API):
============================
    - summarize_document()       → Summarize one uploaded file
    - generate_smart_schedule()  → Create full study plan with sessions

INTERNAL HELPERS (Private):
===========================
    - _clean_json()              → Clean AI response
    - _parse_json_safe()         → Safely parse JSON
    - _day_name()                → Get weekday name
    - _fallback_schedule()       → Backup plan if AI fails

================================================================================
"""

import json
import importlib
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

GroqClient = Any
try:
    _Groq = getattr(importlib.import_module("groq"), "Groq")
    _GROQ_IMPORT_ERROR: Optional[Exception] = None
except Exception as e:
    _Groq = None
    _GROQ_IMPORT_ERROR = e
from app.core.config import settings


# ==============================================================================
# CONFIGURATION
# ==============================================================================

client: Optional[GroqClient] = None
_groq_unavailable_logged = False


def _get_client() -> Optional[GroqClient]:
    """Return a ready Groq client or None when unavailable."""
    global client, _groq_unavailable_logged
    if _GROQ_IMPORT_ERROR is not None:
        if not _groq_unavailable_logged:
            print(f"[groq_service] Groq SDK unavailable: {_GROQ_IMPORT_ERROR}")
            _groq_unavailable_logged = True
        return None

    if client is not None:
        return client

    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        return None

    try:
        client = _Groq(api_key=api_key)  # type: ignore[operator]
        return client
    except Exception as e:
        print(f"[groq_service] Groq client init failed: {e}")
        return None
MODEL = "llama-3.1-8b-instant"  # Free tier model


# ==============================================================================
# INTERNAL HELPERS (Private - used by main functions)
# ==============================================================================

def _clean_json(text: str) -> str:
    """
    Clean AI response by removing markdown code fences.
    
    AI often returns: ```json { ... } ```
    We need just:     { ... }
    """
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_json_safe(text: str, fallback: Any = None) -> Any:
    """
    Safely parse JSON from AI response.
    
    Returns fallback value if parsing fails.
    """
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


def _day_name(date_str: str) -> str:
    """Convert 'YYYY-MM-DD' to weekday name like 'Monday'."""
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
    """
    Generate a SMART backup schedule when AI fails.
    
    This ensures students ALWAYS get a useful study plan, even if:
    - Internet is down
    - AI API has issues
    - Rate limits are hit
    - No documents were uploaded
    
    Uses proven study patterns: Foundation → Deep Dive → Practice → Review
    """
    total_days = (end_date - start_date).days or 1
    num_sessions = min(total_days, 7)  # Max 7 sessions
    
    # Smart study phase templates based on proven learning patterns
    study_phases = [
        {
            "name": "Foundation & Overview",
            "focus": "high",
            "duration": 2.0,
            "tip": f"Start with the fundamentals of {subject}. Read through all materials once without taking notes. Focus on understanding the big picture and how concepts connect."
        },
        {
            "name": "Core Concepts Deep Dive", 
            "focus": "high",
            "duration": 2.5,
            "tip": f"Focus on key definitions, formulas, and core principles. Create summary notes and flashcards for important terms. Don't rush - understanding is more important than coverage."
        },
        {
            "name": "Examples & Applications",
            "focus": "medium",
            "duration": 2.0,
            "tip": "Study worked examples and real-world applications. Try to solve example problems before looking at solutions. Note down any patterns you observe."
        },
        {
            "name": "Practice Problems",
            "focus": "high",
            "duration": 2.5,
            "tip": "Active practice time! Work through problems without looking at notes first. When stuck, try for 10 minutes before checking resources. Track which problem types are difficult."
        },
        {
            "name": "Weak Areas Review",
            "focus": "medium",
            "duration": 2.0,
            "tip": "Revisit topics you found challenging. Re-read relevant sections and try additional practice. Ask yourself: 'Can I explain this to someone else?'"
        },
        {
            "name": "Integration & Connections",
            "focus": "medium",
            "duration": 1.5,
            "tip": "Connect different topics together. Create mind maps or concept diagrams. Understand how one concept builds on another."
        },
        {
            "name": "Final Review & Self-Test",
            "focus": "low",
            "duration": 1.5,
            "tip": "Light review day! Go through your notes and flashcards. Do a timed self-test if possible. Get good sleep - rest helps consolidate learning."
        },
    ]
    
    sessions = []
    
    for i in range(num_sessions):
        session_date = start_date + timedelta(days=int(i * (total_days / num_sessions)))
        phase = study_phases[i % len(study_phases)]
        
        # Determine topics for this session
        if topics and len(topics) > 0:
            # Distribute uploaded topics across sessions
            topic_idx = i % len(topics)
            session_topics = [topics[topic_idx]]
            # Add phase name for context
            if len(topics) > 1:
                session_topics.append(phase["name"])
        else:
            # No uploaded topics - use phase name with subject
            session_topics = [f"{subject}: {phase['name']}"]
        
        sessions.append({
            "day": i + 1,
            "date": session_date.isoformat(),
            "day_name": session_date.strftime("%A"),
            "topics": session_topics,
            "duration_hours": phase["duration"],
            "focus_level": phase["focus"],
            "tips": phase["tip"],
        })

    # Generate meaningful extracted topics
    if topics and len(topics) > 0:
        extracted = topics[:10]
    else:
        extracted = [
            f"{subject} Fundamentals",
            f"{subject} Core Concepts",
            f"Practice & Problem Solving",
            "Review & Consolidation"
        ]

    return {
        "success": True,
        "extracted_topics": extracted,
        "ai_summary": f"A structured {num_sessions}-day study plan for {title}. This schedule follows proven learning patterns: starting with foundations, diving deep into concepts, practicing with problems, and ending with review. Each session is designed to build on the previous one.",
        "ai_tips": [
            f"Start each {subject} session by reviewing your notes from the previous day",
            "Use the Pomodoro technique: 25 minutes focus, 5 minutes break",
            "Teach concepts to yourself out loud - it reveals gaps in understanding",
            "Create one summary page per topic - great for final review",
            "If you're struggling with a concept, try explaining it in simple terms first",
            "Stay hydrated and take short walks between sessions"
        ],
        "document_summaries": document_summaries,
        "sessions": sessions,
    }


# ==============================================================================
# MAIN FUNCTIONS (Public API)
# ==============================================================================

def summarize_document(text: str, subject: str, filename: str) -> Dict[str, Any]:
    """
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  STEP 1: SUMMARIZE ONE DOCUMENT                                          │
    │                                                                          │
    │  Input:  Raw text from PDF/DOCX/PPTX file                               │
    │  Output: Summary + key points + SPECIFIC topics (not generic!)          │
    │                                                                          │
    │  Example:                                                                │
    │    Input:  "Chapter 1: Binary Search Trees... AVL rotation..."          │
    │    Output: {                                                             │
    │      "summary": "Covers tree data structures and balancing",            │
    │      "key_points": ["BST has O(log n) search", "AVL self-balances"],    │
    │      "topics": ["Binary Search Trees", "AVL Trees", "Tree Rotations"]   │
    │    }                                                                     │
    └─────────────────────────────────────────────────────────────────────────┘
    """
    # Limit text length to avoid AI token limits
    truncated = text[:8000] if len(text) > 8000 else text

    prompt = f"""You are an expert academic assistant analyzing study material for "{subject}".

Document: {filename}

--- DOCUMENT CONTENT ---
{truncated}
--- END CONTENT ---

Extract SPECIFIC topics, chapters, and concepts from this document. 
DO NOT use generic terms like "Introduction" or just "{subject}".

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence overview describing what this document teaches",
  "key_points": [
    "Specific fact or concept #1 from the document",
    "Specific definition, formula, or rule #2",
    "Important theory or method #3",
    "Key example or application #4",
    "Critical detail students must remember #5"
  ],
  "topics": [
    "Actual Chapter/Section Name",
    "Specific Concept or Theory Name",
    "Technical Term or Algorithm",
    "Method or Framework Name",
    "Tool or Technology Mentioned"
  ]
}}

RULES:
- Extract REAL topic names from the document content
- Topics should be specific enough to study (e.g., "Merge Sort" not "Sorting")
- Key points should be actual facts a student needs to learn
- Do not include generic placeholders"""

    try:
        active_client = _get_client()
        if not active_client:
            raise RuntimeError("Groq client unavailable")

        response = active_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.2,
        )
        raw = response.choices[0].message.content
        result = _parse_json_safe(raw)
        if result and isinstance(result, dict):
            # Filter out overly generic topics
            topics = result.get("topics", [])
            generic_terms = [subject.lower(), "introduction", "overview", "summary", "basics", "fundamentals"]
            filtered_topics = [
                t for t in topics 
                if t.lower().strip() not in generic_terms and len(t) > 2
            ][:8]
            
            return {
                "summary": result.get("summary", ""),
                "key_points": result.get("key_points", [])[:6],
                "topics": filtered_topics if filtered_topics else [f"{subject} Concepts"],
            }
    except Exception as e:
        print(f"[groq_service] summarize_document error for {filename}: {e}")

    # Fallback if AI fails - still try to be somewhat specific
    clean_name = filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
    return {
        "summary": f"Study material from {filename} covering {subject} concepts and theories.",
        "key_points": [
            f"Review core {subject} concepts in this document",
            "Identify key definitions, formulas, and rules",
            "Note important examples and practical applications",
            "Understand relationships between concepts"
        ],
        "topics": [f"{subject}: {clean_name}"],
    }


def generate_smart_schedule(
    documents_data: List[Dict[str, str]],
    subject: str,
    title: str,
    deadline: datetime,
    task_created_at: datetime,
) -> Dict[str, Any]:
    """
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  STEP 2: GENERATE COMPLETE STUDY SCHEDULE                                │
    │                                                                          │
    │  This is the MAIN function that creates your study plan!                │
    │                                                                          │
    │  FLOW:                                                                   │
    │  ──────                                                                  │
    │    1. Calculate study window (start date → deadline)                    │
    │    2. Summarize each uploaded document (calls summarize_document)       │
    │    3. Ask AI to create day-by-day study sessions                        │
    │    4. Return complete schedule with tips                                │
    │                                                                          │
    │  Input:                                                                  │
    │    - documents_data: [{filename, text}, ...]  (from uploaded files)     │
    │    - subject: "Data Structures"                                         │
    │    - title: "Final Exam Prep"                                           │
    │    - deadline: 2026-03-15                                               │
    │    - task_created_at: 2026-03-01                                        │
    │                                                                          │
    │  Output:                                                                 │
    │    {                                                                     │
    │      "success": true,                                                   │
    │      "extracted_topics": ["Arrays", "Linked Lists", "Trees"],           │
    │      "ai_summary": "14-day plan covering core data structures...",      │
    │      "ai_tips": ["Start with basics", "Practice daily"],                │
    │      "document_summaries": [...],                                       │
    │      "sessions": [                                                      │
    │        {day: 1, date: "2026-03-01", topics: ["Arrays"], ...},          │
    │        {day: 2, date: "2026-03-02", topics: ["Linked Lists"], ...}     │
    │      ]                                                                   │
    │    }                                                                     │
    └─────────────────────────────────────────────────────────────────────────┘
    """
    
    # ══════════════════════════════════════════════════════════════════════
    # STEP 2.1: Calculate Study Window
    # ══════════════════════════════════════════════════════════════════════
    today = datetime.utcnow().date()
    start_date = max(task_created_at.date(), today)  # Start from today or task creation
    end_date = deadline.date()

    # Ensure at least 1 day window
    if end_date <= start_date:
        end_date = start_date + timedelta(days=1)

    total_days = (end_date - start_date).days
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    # ══════════════════════════════════════════════════════════════════════
    # STEP 2.2: Summarize Each Uploaded Document
    # ══════════════════════════════════════════════════════════════════════
    document_summaries: List[Dict[str, Any]] = []
    combined_texts: List[str] = []
    all_topics: List[str] = []

    for doc in documents_data:
        fname = doc.get("filename", "document")
        text = doc.get("text", "")
        
        # Call summarize_document for each file
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
    unique_topics = list(dict.fromkeys(all_topics))  # Remove duplicates

    # ══════════════════════════════════════════════════════════════════════
    # STEP 2.3: Build AI Prompt for Schedule Generation
    # ══════════════════════════════════════════════════════════════════════
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

Create a SMART study schedule with specific, actionable sessions. Return ONLY valid JSON:
{{
  "extracted_topics": ["Specific Topic 1", "Specific Topic 2", "Specific Topic 3"],
  "ai_summary": "2-3 sentence personalized overview explaining the study approach and what will be covered",
  "ai_tips": [
    "Specific actionable tip #1 for this subject",
    "Study technique tip #2 relevant to the material",
    "Time management tip #3",
    "Retention/memory tip #4"
  ],
  "sessions": [
    {{
      "day": 1,
      "date": "{start_str}",
      "day_name": "Monday",
      "topics": ["Specific topic from material"],
      "duration_hours": 2.0,
      "focus_level": "high",
      "tips": "SPECIFIC tip for THIS session: what to do, how to study this topic, what to focus on"
    }}
  ]
}}

IMPORTANT RULES FOR QUALITY:
1. Topics must be SPECIFIC concepts/chapters from the material, NOT generic like "{subject}" or "Review"
2. Session tips must be ACTIONABLE and SPECIFIC to that day's topic (e.g., "Practice 5 binary search problems" not "Study well")
3. ai_tips must be practical advice for studying THIS subject specifically
4. ai_summary should mention actual topics that will be covered
5. Spread topics logically: fundamentals first, then advanced, then practice/review
6. High focus for difficult/new topics, medium for practice, low for review

DATE RULES:
- All dates MUST be between {start_str} and {end_str} INCLUSIVE
- Generate {min(total_days, 10)} sessions maximum
- focus_level: "low", "medium", or "high" only
- duration_hours: 0.5 to 4.0

Return ONLY valid JSON — no markdown, no explanation."""

    # ══════════════════════════════════════════════════════════════════════
    # STEP 2.4: Call AI and Process Response
    # ══════════════════════════════════════════════════════════════════════
    active_client = _get_client()
    if not active_client:
        return _fallback_schedule(
            subject=subject,
            title=title,
            start_date=start_date,
            end_date=end_date,
            topics=unique_topics or [subject],
            document_summaries=document_summaries,
        )

    try:
        response = active_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.3,
        )
        raw = response.choices[0].message.content
        result = _parse_json_safe(raw)

        if result and isinstance(result, dict) and result.get("sessions"):
            # Validate and fix session dates
            sessions = []
            for i, s in enumerate(result["sessions"]):
                sdate = s.get("date", start_str)
                # Clamp dates to valid range
                if sdate < start_str or sdate > end_str:
                    sdate = start_str
                
                # Get topics, filter out generic ones
                session_topics = s.get("topics", [subject])
                if session_topics == [subject] or not session_topics:
                    session_topics = [f"{subject} - Day {i+1}"]
                    
                sessions.append({
                    "day": s.get("day", i + 1),
                    "date": sdate,
                    "day_name": s.get("day_name", _day_name(sdate)),
                    "topics": session_topics,
                    "duration_hours": float(s.get("duration_hours", 2.0)),
                    "focus_level": s.get("focus_level", "medium"),
                    "tips": s.get("tips", "Stay focused and take short breaks."),
                })

            extracted_topics = (
                result.get("extracted_topics")
                or unique_topics
                or [subject]
            )

            # SUCCESS! Return the AI-generated schedule
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

    # ══════════════════════════════════════════════════════════════════════
    # STEP 2.5: Fallback if AI Fails
    # ══════════════════════════════════════════════════════════════════════
    return _fallback_schedule(
        subject=subject,
        title=title,
        start_date=start_date,
        end_date=end_date,
        topics=unique_topics or [subject],
        document_summaries=document_summaries,
    )


# ==============================================================================
# END OF FILE
# ==============================================================================
