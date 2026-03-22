"""
EduSense - Chat Service for AI Coach

Provides endpoints for chatting with the AI.
"""

import google.genai as genai
from typing import Optional, List
from fastapi import HTTPException
from app.core.config import settings
from app.services.embedding_service import generate_embedding, find_similar_concepts

# Configure Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def chat_with_coach(user_id: str, message: str, subject: Optional[str] = None, student_level: str = "Intermediate") -> str:
    """
    Simulates a chat with an AI coach.
    1. Converts student message to vector
    2. Compares with PDF vectors (Concepts)
    3. Prompts the AI strictly as an AI coach using context
    """
    
    # 1. Embed the student message
    query_embedding = await generate_embedding(message)
    
    # 2. Find similar concepts (the semantic search part)
    concepts = await find_similar_concepts(
        query_embedding=query_embedding,
        user_id=user_id,
        subject=subject,
        top_k=3,  # Top 3 most relevant concepts
        min_similarity=0.3
    )
    
    # 3. Build context from retrieved concepts
    context_text = "No additional context found."
    if concepts:
        context_parts = []
        for i, c in enumerate(concepts):
            context_parts.append(f"Context {i+1} ({c.get('title', 'Untitled')}): {c.get('summary', '')}")
        context_text = "\n\n".join(context_parts)
        
    # 4. Construct AI System Prompt
    system_prompt = f"""You are **EduSense AI Productivity Coach** – university studentge personal AI academic assistant. 
Never act like a normal chatbot. Always be friendly, motivating, and speak in **simple Sinhala/English mix** (student teren widiyata).

Student Details (use these to personalize):
- Student ID: {user_id}
- Current Productivity Score: 75% (last week completion rate)
- Weak areas: Math & Physics (past quiz scores low)
- Current workload: 3 pending tasks this week
- Preferred style: simple examples + short explanations + daily tips

Strict Rules:
1. **Use ONLY the provided PDF content** below. Do not add external knowledge.
   PDF Content:
   {context_text}

2. If student asks anything outside PDF → politely say "Me PDF eke naha, but oya productivity improve karanna me tip eka balanna…"

3. **Always analyze student context** before answering:
   - If productivity score < 60% → give extra motivation + shorter study plan
   - If overload detected (more than 2 deadlines this week) → warn and suggest "Machan, today overload, PDF eken only 1 section karanna"

4. Every answer **must** include:
   - Simple explanation (student teren widiyata)
   - 1 real-life example
   - 1 motivation nudge (e.g. "Oya 80% score gatta last time, me wathura eka clear karamu!")
   - 1 practical study tip (e.g. "25 min Pomodoro use karanna")

5. Answer length: Maximum 150-200 words (short & clear)
6. End with a small action item: "Next step: ___ karanna"

Current date: March 2026
Studentge language level: beginner-intermediate

Now answer the student's question with full personalization and motivation.
"""

    # 5. Get answer from Gemini
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=system_prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Chat generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response.")
