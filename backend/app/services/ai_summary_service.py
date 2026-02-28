"""
EduSense - AI Summary Service

Uses Google Gemini AI to:
1. Summarize extracted text from study materials
2. Extract key points for quick reference
3. Identify concepts with difficulty and time estimates
4. Handle quota errors (429) gracefully with fallback summaries
"""

import json
import re
from typing import Dict, List, Optional
import google.genai as genai
from app.core.config import settings


# Configure Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


def create_fallback_summary(text: str) -> Dict:
    """
    Create a fallback summary when AI quota is exhausted.
    Uses simple heuristics to extract headings and first lines.
    
    Args:
        text: The extracted text to summarize
        
    Returns:
        Dictionary with summary, key_points, and concepts
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Take first 500 chars as summary
    summary = text[:500] + "..." if len(text) > 500 else text
    
    # Try to find headings (lines that are short and might be titles)
    headings = [line for line in lines[:20] if len(line) < 80 and len(line) > 5]
    key_points = headings[:5] if headings else lines[:5]
    
    # Create basic concepts from headings
    concepts = []
    for idx, heading in enumerate(headings[:5]):
        concepts.append({
            "title": heading,
            "summary": f"Topic extracted from material: {heading}",
            "difficulty": "medium",  # Default difficulty
            "estimated_minutes": 30  # Default time estimate
        })
    
    # If no headings found, create generic concepts
    if not concepts:
        concepts = [{
            "title": "Study Material Content",
            "summary": summary,
            "difficulty": "medium",
            "estimated_minutes": 60
        }]
    
    return {
        "summary": summary,
        "key_points": key_points,
        "concepts": concepts
    }


async def summarize_material(text: str, subject: str, filename: str) -> Dict:
    """
    Use Gemini AI to summarize material and extract concepts.
    Falls back to simple extraction if quota is exceeded (429 error).
    
    Args:
        text: Extracted text from the study material
        subject: Subject/course this material belongs to
        filename: Original filename for context
        
    Returns:
        Dictionary containing:
        - summary: Overall summary of the material
        - key_points: List of key points (bullets)
        - concepts: List of concepts with title, summary, difficulty, estimated_minutes
    """
    # Limit text length for API call (max ~8000 chars)
    truncated_text = text[:8000] if len(text) > 8000 else text
    truncation_note = " [Text truncated for analysis]" if len(text) > 8000 else ""
    
    prompt = f"""You are an expert academic content analyzer for university students.

TASK: Analyze the following study material and extract structured information.

SUBJECT: {subject}
FILENAME: {filename}
CONTENT:
---
{truncated_text}{truncation_note}
---

INSTRUCTIONS:
1. Provide a concise 2-3 sentence summary of the entire material
2. Extract 5-10 key points (important facts, definitions, formulas)
3. Identify 3-8 main concepts/topics with:
   - title: Concept name (max 100 chars)
   - summary: Brief explanation (1-2 sentences)
   - difficulty: "easy", "medium", or "hard"
   - estimated_minutes: Time needed to study this concept (15-90 minutes)

RESPOND WITH ONLY VALID JSON (no markdown, no code blocks, no extra text):
{{
  "summary": "Overall summary of the material in 2-3 sentences",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "concepts": [
    {{
      "title": "Concept name",
      "summary": "Brief explanation of the concept",
      "difficulty": "medium",
      "estimated_minutes": 30
    }}
  ]
}}

RULES:
- summary must be 2-3 sentences
- Extract 5-10 key_points (short, actionable)
- Identify 3-8 concepts
- difficulty must be "easy", "medium", or "hard"
- estimated_minutes must be between 15 and 90
- Return ONLY valid JSON, no extra text
"""

    try:
        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Clean up response - remove markdown code blocks if present
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        
        # Validate structure
        if not isinstance(result.get("summary"), str):
            raise ValueError("Invalid summary format")
        if not isinstance(result.get("key_points"), list):
            raise ValueError("Invalid key_points format")
        if not isinstance(result.get("concepts"), list):
            raise ValueError("Invalid concepts format")
        
        # Validate each concept
        for concept in result["concepts"]:
            if not all(k in concept for k in ["title", "summary", "difficulty", "estimated_minutes"]):
                raise ValueError("Invalid concept structure")
            if concept["difficulty"] not in ["easy", "medium", "hard"]:
                concept["difficulty"] = "medium"  # Fix invalid difficulty
            if not isinstance(concept["estimated_minutes"], int) or concept["estimated_minutes"] < 15:
                concept["estimated_minutes"] = 30  # Fix invalid time
        
        return result
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Check for quota/rate limit errors (429)
        if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg:
            print(f"⚠️ AI quota exceeded, using fallback summary for {filename}")
            return create_fallback_summary(text)
        
        # For other errors, also use fallback but log the error
        print(f"⚠️ Error calling Gemini API: {e}. Using fallback summary.")
        return create_fallback_summary(text)


async def generate_concept_summary(concept_title: str, concept_text: str) -> str:
    """
    Generate a brief summary for a specific concept.
    Used when concepts are extracted from material.
    
    Args:
        concept_title: Title of the concept
        concept_text: Relevant text about the concept
        
    Returns:
        Brief 1-2 sentence summary of the concept
    """
    # Simple fallback: return first 200 chars of text
    fallback = concept_text[:200] + "..." if len(concept_text) > 200 else concept_text
    
    try:
        prompt = f"""Summarize this concept in 1-2 sentences:

CONCEPT: {concept_title}
CONTENT: {concept_text[:500]}

Respond with ONLY the summary text, no extra formatting."""

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        
        summary = response.text.strip()
        return summary if summary else fallback
        
    except Exception:
        return fallback
