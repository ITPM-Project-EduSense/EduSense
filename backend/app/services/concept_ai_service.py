"""
EduSense - Concept Extraction AI Service

Uses Google Gemini AI to:
1. Analyze extracted study material text
2. Identify and extract key concepts
3. Categorize concepts by difficulty level
4. Estimate study time for each concept
"""

import json
import re
import asyncio
from typing import List, Dict
from fastapi import HTTPException
import google.genai as genai
from app.core.config import settings


# Configure Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def generate_concepts_from_text(text: str, max_retries: int = 3) -> List[Dict]:
    """
    Use Gemini AI to extract key concepts from study material text.
    
    Args:
        text: The extracted text from a study material document
        max_retries: Maximum number of retry attempts on failure (default: 3)
        
    Returns:
        List of concept dictionaries with title, summary, difficulty, and estimated_minutes
        
    Raises:
        HTTPException: If AI generation or JSON parsing fails after all retries
    """
    # Truncate text if too long (to stay within token limits)
    max_chars = 30000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[Content truncated for processing...]"
    
    # Build the prompt
    prompt = f"""You are an expert educational content analyzer AI.

TASK: Analyze the following study material text and extract the most important concepts that a student should learn.

STUDY MATERIAL TEXT:
---
{text}
---

INSTRUCTIONS:
1. Identify the 10-20 most important concepts, topics, or learning objectives from this material
2. For each concept, provide:
   - A clear, concise title
   - A 2-3 sentence summary explaining what the student needs to understand
   - Difficulty level: "easy", "medium", or "hard"
   - Estimated study time in minutes (realistic estimate: 5-60 minutes per concept)
3. Prioritize breadth - cover different areas of the material
4. Order concepts from foundational (easier) to advanced (harder)

RESPOND WITH ONLY VALID JSON (no markdown, no code blocks, no extra text before or after):
{{
  "concepts": [
    {{
      "title": "Clear concept title",
      "summary": "2-3 sentence explanation of what to learn",
      "difficulty": "easy",
      "estimated_minutes": 15
    }},
    {{
      "title": "Another concept",
      "summary": "Explanation here",
      "difficulty": "medium",
      "estimated_minutes": 30
    }}
  ]
}}

RULES:
- Extract between 10-20 concepts (more is better if material is rich)
- title must be concise (max 100 characters)
- summary must be informative (2-4 sentences)
- difficulty must be EXACTLY one of: "easy", "medium", "hard"
- estimated_minutes must be a number between 5 and 60
- Order concepts logically from basic to advanced
- Focus on concepts a student would need to study, not just topics mentioned
"""

    last_error = None
    
    # Retry loop with exponential backoff
    for attempt in range(max_retries):
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
            
            # Parse JSON response
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError as je:
                # Try to extract JSON from response if there's extra text
                json_match = re.search(r'\{[\s\S]*"concepts"[\s\S]*\}', response_text)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    raise je
            
            # Validate response structure
            if "concepts" not in data:
                raise ValueError("Response missing 'concepts' field")
            
            concepts = data["concepts"]
            
            if not isinstance(concepts, list):
                raise ValueError("'concepts' field must be an array")
            
            if len(concepts) == 0:
                raise ValueError("No concepts extracted from text")
            
            # Validate each concept has required fields
            validated_concepts = []
            for i, concept in enumerate(concepts):
                # Check required fields
                required_fields = ["title", "summary", "difficulty", "estimated_minutes"]
                for field in required_fields:
                    if field not in concept:
                        raise ValueError(f"Concept {i} missing required field: {field}")
                
                # Validate difficulty value
                if concept["difficulty"] not in ["easy", "medium", "hard"]:
                    # Try to normalize common variations
                    difficulty_lower = concept["difficulty"].lower().strip()
                    if difficulty_lower in ["easy", "medium", "hard"]:
                        concept["difficulty"] = difficulty_lower
                    else:
                        concept["difficulty"] = "medium"  # Default to medium if invalid
                
                # Validate estimated_minutes is a number
                try:
                    minutes = int(concept["estimated_minutes"])
                    concept["estimated_minutes"] = max(5, min(60, minutes))  # Clamp to 5-60
                except (ValueError, TypeError):
                    concept["estimated_minutes"] = 20  # Default to 20 minutes
                
                # Ensure title and summary are strings
                concept["title"] = str(concept["title"])[:200]  # Limit title length
                concept["summary"] = str(concept["summary"])[:1000]  # Limit summary length
                
                validated_concepts.append(concept)
            
            # Success! Return the validated concepts
            return validated_concepts
            
        except json.JSONDecodeError as e:
            last_error = f"Failed to parse AI response as JSON: {str(e)}"
            
        except ValueError as e:
            last_error = f"Invalid response structure: {str(e)}"
            
        except Exception as e:
            last_error = f"AI generation error: {str(e)}"
        
        # If not the last attempt, wait before retrying (exponential backoff)
        if attempt < max_retries - 1:
            wait_time = 2 ** attempt  # 1s, 2s, 4s
            await asyncio.sleep(wait_time)
    
    # All retries exhausted
    raise HTTPException(
        status_code=500,
        detail=f"Failed to generate concepts after {max_retries} attempts. Last error: {last_error}"
    )


async def generate_and_save_concepts(material_id: str, user_id: str) -> List[Dict]:
    """
    Generate concepts from a StudyMaterial document and save them to the database.
    
    Args:
        material_id: ID of the StudyMaterial document
        user_id: ID of the user (for authorization and ownership)
        
    Returns:
        List of saved Concept documents as dictionaries
        
    Raises:
        HTTPException: If material not found, unauthorized, or concept generation fails
    """
    from app.models.study_material import StudyMaterial, Concept
    from beanie import PydanticObjectId
    
    # Fetch the study material
    try:
        material = await StudyMaterial.get(PydanticObjectId(material_id))
    except:
        raise HTTPException(status_code=404, detail="Study material not found")
    
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    
    # Verify ownership
    if material.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to study material")
    
    # Generate concepts from the extracted text
    concepts_data = await generate_concepts_from_text(material.extracted_text)
    
    # Import embedding service
    from app.services.embedding_service import generate_embedding
    
    # Save concepts to database with real embeddings
    saved_concepts = []
    for concept_data in concepts_data:
        # Generate embedding from concept title + summary
        text_to_embed = f"{concept_data['title']}\n\n{concept_data['summary']}"
        
        try:
            embedding = await generate_embedding(text_to_embed)
        except HTTPException:
            # If embedding generation fails, use zero vector as fallback
            embedding = [0.0] * 768
        
        concept = Concept(
            user_id=user_id,
            material_id=material_id,
            title=concept_data["title"],
            summary=concept_data["summary"],
            difficulty=concept_data["difficulty"],
            estimated_minutes=concept_data["estimated_minutes"],
            embedding=embedding
        )
        await concept.insert()
        saved_concepts.append({
            "id": str(concept.id),
            "title": concept.title,
            "summary": concept.summary,
            "difficulty": concept.difficulty,
            "estimated_minutes": concept.estimated_minutes,
            "created_at": concept.created_at.isoformat()
        })
    
    return saved_concepts
