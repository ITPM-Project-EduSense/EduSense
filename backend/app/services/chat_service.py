"""
EduSense - Chat Service for AI Coach

Provides endpoints for chatting with the AI.
"""

from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from groq import Groq
from app.core.config import settings
from app.services.embedding_service import generate_embedding, find_similar_concepts, cosine_similarity
from app.models.study_material import PdfVector
from app.models.chat_history import ChatHistory

# Configure Groq client lazily so missing/invalid config does not crash requests.
groq_client = None
GROQ_MODEL = "llama-3.3-70b-versatile"


def get_groq_client() -> Optional[Groq]:
    """Return a reusable Groq client when configured, otherwise None."""
    global groq_client
    if groq_client is not None:
        return groq_client

    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        return None

    try:
        groq_client = Groq(api_key=api_key)
        return groq_client
    except Exception as e:
        print(f"Groq client init failed: {e}")
        return None


def _to_number(value: Any, default: float = 0.0) -> float:
    """Convert unknown values into a float safely."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_level(value: Optional[str]) -> str:
    """Normalize incoming level labels to supported coach levels."""
    normalized = (value or "intermediate").strip().lower()
    if normalized in {"beginner", "intermediate", "advanced"}:
        return normalized
    if normalized in {"low", "safe"}:
        return "advanced"
    if normalized in {"warning", "medium", "moderate"}:
        return "intermediate"
    if normalized in {"high", "critical"}:
        return "beginner"
    return "intermediate"


def _infer_student_level_from_profile(student_profile: Optional[Dict[str, Any]], fallback_level: str) -> str:
    """Infer coaching level from the four analytics signals when available."""
    if not student_profile:
        return _normalize_level(fallback_level)

    risk_score = _to_number(student_profile.get("academic_risk_analysis", {}).get("score"), 0.0)
    deadline_prob = _to_number(student_profile.get("predictive_deadline_risk", {}).get("probability"), 0.0)
    burnout_score = _to_number(student_profile.get("burnout_index", {}).get("score"), 0.0)
    predicted_gpa = _to_number(student_profile.get("gpa_prediction", {}).get("predicted_gpa"), 0.0)
    has_gpa_data = bool(student_profile.get("gpa_prediction", {}).get("has_valid_data", False))

    gpa_risk = max(0.0, min(100.0, 100.0 - (predicted_gpa / 4.0 * 100.0))) if has_gpa_data else 50.0
    composite_risk = (risk_score + deadline_prob + burnout_score + gpa_risk) / 4.0

    if composite_risk >= 67:
        return "beginner"
    if composite_risk >= 34:
        return "intermediate"
    return "advanced"


def _build_student_profile_text(student_profile: Optional[Dict[str, Any]], level: str) -> str:
    """Build a compact analytics summary for the AI coach prompt."""
    if not student_profile:
        return f"Student analytics profile not provided. Use coaching level '{level}'."

    academic = student_profile.get("academic_risk_analysis", {})
    deadline = student_profile.get("predictive_deadline_risk", {})
    gpa = student_profile.get("gpa_prediction", {})
    burnout = student_profile.get("burnout_index", {})

    return (
        "Student Analytics Snapshot:\n"
        f"- Computed Coaching Level: {level}\n"
        f"- Academic Risk Analysis: score={academic.get('score', 0)}, level={academic.get('level', 'unknown')}\n"
        f"- Predictive Deadline Risk: probability={deadline.get('probability', 0)}%, level={deadline.get('level', 'unknown')}\n"
        f"- GPA Prediction: predicted_gpa={gpa.get('predicted_gpa', 0)} / 4.0, subjects={gpa.get('subject_count', 0)}, has_valid_data={gpa.get('has_valid_data', False)}\n"
        f"- Burnout Index: score={burnout.get('score', 0)}, level={burnout.get('level', 'unknown')}"
    )


def build_fallback_reply(message: str, context_text: str, student_level: str, student_profile_text: str = "") -> str:
    """Generate a deterministic markdown reply when external AI providers are unavailable."""
    if context_text and context_text != "No additional context found.":
        return (
            f"## EduSense AI Coach\n\n"
            f"I can still help while the AI provider is temporarily unavailable.\n\n"
            f"### Your Question\n"
            f"{message}\n\n"
            f"### Student Snapshot\n"
            f"{student_profile_text or 'Not available'}\n\n"
            f"### Related Study Context\n"
            f"{context_text}\n\n"
            f"### Next Steps\n"
            f"1. Focus on the most relevant concept above and summarize it in your own words.\n"
            f"2. Create 3 short practice questions from that concept.\n"
            f"3. Tell me your answer attempts and I will help you refine them.\n\n"
            f"_Student level detected: {student_level}_"
        )

    return (
        f"## EduSense AI Coach\n\n"
        f"I can answer your question, but I currently do not have enough processed study context or the AI provider is unavailable.\n\n"
        f"### Your Question\n"
        f"{message}\n\n"
        f"### Student Snapshot\n"
        f"{student_profile_text or 'Not available'}\n\n"
        f"### What To Do Next\n"
        f"1. Upload a study material in the Materials page.\n"
        f"2. Ask the same question again for context-grounded guidance.\n"
        f"3. If this keeps happening, verify GROQ_API_KEY in backend/.env.\n\n"
        f"_Student level detected: {student_level}_"
    )


async def get_recent_chat_history(user_id: str, subject: Optional[str] = None, limit: int = 6) -> List[Dict]:
    """
    Return recent chat turns for continuity in AI responses.
    """
    query = ChatHistory.find(ChatHistory.user_id == user_id)
    if subject:
        query = query.find(ChatHistory.subject == subject)
    docs = await query.sort("-created_at").limit(limit).to_list()
    docs.reverse()
    return [
        {"user_message": d.user_message, "ai_reply": d.ai_reply, "created_at": d.created_at.isoformat()}
        for d in docs
    ]


async def save_chat_history(
    user_id: str,
    user_message: str,
    ai_reply: str,
    subject: Optional[str] = None,
    context_used: str = "",
) -> str:
    """
    Save one user/AI chat turn into MongoDB.
    """
    chat_doc = ChatHistory(
        user_id=user_id,
        subject=subject,
        user_message=user_message,
        ai_reply=ai_reply,
        context_used=context_used[:8000],
    )
    await chat_doc.insert()
    return str(chat_doc.id)


async def chat_with_coach(
    user_id: str,
    message: str,
    subject: Optional[str] = None,
    student_level: str = "intermediate",
    student_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Simulates a chat with an AI coach.
    1. Converts student message to vector
    2. Compares with PDF vectors (Concepts)
    3. Prompts the AI strictly as an AI coach using context
    """
    
    # 1. Embed the student message
    query_embedding = await generate_embedding(message)
    
    # 2. Find similar concepts (existing concept pipeline)
    try:
        concepts = await find_similar_concepts(
            query_embedding=query_embedding,
            user_id=user_id,
            subject=subject,
            top_k=3,  # Top 3 most relevant concepts
            min_similarity=0.3
        )
    except Exception as e:
        print(f"Concept retrieval failed: {e}")
        concepts = []
    
    # 3. Retrieve closest PDF vector chunks stored in MongoDB
    vector_contexts = []
    try:
        vectors = await PdfVector.find(PdfVector.user_id == user_id).to_list()
        ranked = []
        for vec in vectors:
            if subject and vec.metadata.get("subject") != subject:
                continue
            if not vec.embedding:
                continue
            try:
                sim = cosine_similarity(query_embedding, vec.embedding)
                if sim >= 0.25:
                    ranked.append((sim, vec))
            except ValueError:
                continue

        ranked.sort(key=lambda item: item[0], reverse=True)
        for sim, vec in ranked[:4]:
            filename = vec.metadata.get("filename", "uploaded_file")
            vector_contexts.append(
                f"PDF Chunk ({filename}, sim={round(sim, 3)}): {vec.chunk_text}"
            )
    except Exception as e:
        print(f"Vector retrieval failed: {e}")

    # 4. Build context from concepts + vectors
    context_text = "No additional context found."
    context_parts = []
    if concepts:
        for i, c in enumerate(concepts):
            context_parts.append(f"Concept {i+1} ({c.get('title', 'Untitled')}): {c.get('summary', '')}")
    if vector_contexts:
        context_parts.extend(vector_contexts)
    if context_parts:
        context_text = "\n\n".join(context_parts)

    # 5. Include recent chat history for continuity
    recent_history = await get_recent_chat_history(user_id=user_id, subject=subject, limit=6)
    history_text = "No previous chat history."
    if recent_history:
        lines = []
        for idx, item in enumerate(recent_history, start=1):
            lines.append(
                f"Turn {idx} User: {item['user_message']}\nTurn {idx} Coach: {item['ai_reply']}"
            )
        history_text = "\n\n".join(lines)

    level_for_prompt = _infer_student_level_from_profile(student_profile, student_level)
    student_profile_text = _build_student_profile_text(student_profile, level_for_prompt)

    # 6. Construct AI System Prompt (UPDATED)
    system_prompt = f"""You are **EduSense AI Coach** – a highly effective, accurate, and student-friendly academic tutor.

Your goal is to provide **clear, complete, and well-structured explanations** based ONLY on the provided study material.

Student Details:
- Academic Level: {level_for_prompt}
- Analytics:
{student_profile_text}

### STRICT RULES:

1. **Use ONLY the provided content** below. Do not hallucinate or add external information.
   Provided Study Content:
   {context_text}

2. Maintain consistency with previous conversation:
   Recent History:
   {history_text}

3. **Response Format Requirements** (Very Important):
   - Use **Markdown formatting** for beautiful rendering.
   - Use proper headings: # for main title, ## for subheadings, ### for smaller sections.
   - Use **bold** for important terms.
   - Use bullet points (- or *) and numbered lists (1., 2.) where appropriate.
   - Use emojis naturally (📌, ✅, 💡, 📝, 🔑, etc.) to make it engaging.
   - Use `code blocks` for definitions, formulas, or key points when needed.
   - Break long explanations into short paragraphs.

4. **Structure your answer** like this (when possible):
   - Start with a short friendly greeting/introduction (1 line)
   - Main explanation with clear sections
   - Key Points (in bullets)
   - Examples (if applicable)
   - Summary or Important Takeaways
   - End with a clear "Next Step" or practice suggestion

5. Adapt depth to student level:
    - beginner: Simple language + more examples + analogies
    - intermediate: Clear + some technical depth
    - advanced: More detailed and precise

6. Be **accurate, educational, and motivating** — but prioritize **accuracy and completeness** over being overly short.

7. After the main explanation, include a short personalized student-understanding note (2-3 lines) based on the analytics and the student's latest message. Keep this natural in prose and do not use a fixed heading title.

Now, answer the student's question accurately and in rich markdown format:"""


    # 7. Get answer from Groq
    client = get_groq_client()
    if not client:
        reply = build_fallback_reply(
            message=message,
            context_text=context_text,
            student_level=level_for_prompt,
            student_profile_text=student_profile_text,
        )
        await save_chat_history(
            user_id=user_id,
            user_message=message,
            ai_reply=reply,
            subject=subject,
            context_used=context_text,
        )
        return reply

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.4,        # Slightly higher for better formatting
            max_tokens=1200,        # Increased from 512 → allows longer, richer responses
        )
        
        reply = (response.choices[0].message.content or "").strip()
        if not reply:
            raise ValueError("Empty response from Groq")
        await save_chat_history(
            user_id=user_id,
            user_message=message,
            ai_reply=reply,
            subject=subject,
            context_used=context_text,
        )
        return reply
    except Exception as e:
        print(f"Chat generation failed (Groq): {e}")
        fallback_reply = build_fallback_reply(
            message=message,
            context_text=context_text,
            student_level=level_for_prompt,
            student_profile_text=student_profile_text,
        )
        await save_chat_history(
            user_id=user_id,
            user_message=message,
            ai_reply=fallback_reply,
            subject=subject,
            context_used=context_text,
        )
        return fallback_reply