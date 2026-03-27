"""
EduSense - Chat Service for AI Coach

Provides endpoints for chatting with the AI.
"""

from typing import Optional, List, Dict
from fastapi import HTTPException
from groq import Groq
from app.core.config import settings
from app.services.embedding_service import generate_embedding, find_similar_concepts, cosine_similarity
from app.models.study_material import PdfVector
from app.models.chat_history import ChatHistory

# Configure Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
GROQ_MODEL = "llama-3.3-70b-versatile"


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


async def chat_with_coach(user_id: str, message: str, subject: Optional[str] = None, student_level: str = "Intermediate") -> str:
    """
    Simulates a chat with an AI coach.
    1. Converts student message to vector
    2. Compares with PDF vectors (Concepts)
    3. Prompts the AI strictly as an AI coach using context
    """
    
    # 1. Embed the student message
    query_embedding = await generate_embedding(message)
    
    # 2. Find similar concepts (existing concept pipeline)
    concepts = await find_similar_concepts(
        query_embedding=query_embedding,
        user_id=user_id,
        subject=subject,
        top_k=3,  # Top 3 most relevant concepts
        min_similarity=0.3
    )
    
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

    # 6. Construct AI System Prompt
    system_prompt = f"""You are **EduSense AI Productivity Coach** – a university student’s personal AI academic assistant.

Never act like a normal chatbot. Always be friendly, motivating, and speak in **simple English** (easy for students to understand).

Student Details (use these to personalize):
- Student ID: {user_id}
- Academic level: {student_level}
- Preferred style: simple examples + short explanations + daily tips

Strict Rules:
1. **Use ONLY the provided PDF content** below. Do not add external knowledge.
   PDF Content:
   {context_text}

2. Keep conversation consistent with previous turns.
   Recent conversation:
   {history_text}

3. If the student asks anything outside the PDF → politely say:
   "This is not in the PDF, but here’s a productivity tip to help you improve…"

4. **Adapt your explanation depth** to the student’s level ({student_level}):
   - Beginner: use very simple language, more analogies, step-by-step breakdowns
   - Intermediate: balanced explanations with some technical terms
   - Advanced: concise, technical depth welcome

5. Every answer **must include**:
   - Simple explanation (easy to understand)
   - 1 real-life example
   - 1 motivation nudge (e.g., "Keep it up – you’re making great progress!")
   - 1 practical study tip (e.g., "Use 25-minute Pomodoro sessions")

6. Answer length: Maximum 200-500 words (short & clear)

7. End with a small action item:
   "Next step: ___"
 
Now answer the student's question with full personalization and motivation."""

    # 7. Get answer from Groq
    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured on the server."
        )

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=0.3,
            max_tokens=512,
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
        raise HTTPException(status_code=500, detail="Failed to generate AI response.")
