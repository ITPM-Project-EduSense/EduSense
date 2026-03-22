"""
EduSense - Concept Extraction Service

Uses rule-based text analysis to extract concepts from study materials.
NO AI API REQUIRED - Works offline and reliably.
"""

import asyncio
from typing import List, Dict
from fastapi import HTTPException
from app.services.concept_rule_engine import extract_concepts_from_text, generate_embedding_simple


async def generate_concepts_from_text(text: str, max_retries: int = 3) -> List[Dict]:
    """
    Extract key concepts from study material using rule-based text analysis.
    
    Args:
        text: The extracted text from a study material document
        max_retries: Ignored (for compatibility), uses rule engine instead
        
    Returns:
        List of concept dictionaries with title, summary, difficulty, and estimated_minutes
    """
    try:
        print(f"🔍 Extracting concepts using rule-based engine...")
        
        # Truncate text if too long
        max_chars = 50000
        if len(text) > max_chars:
            text = text[:max_chars]
        
        # Use rule-based engine to extract concepts (runs immediately, no API calls)
        concepts = extract_concepts_from_text(text)
        
        if not concepts or len(concepts) == 0:
            raise ValueError("No concepts could be extracted from the text")
        
        print(f"✅ Successfully extracted {len(concepts)} concepts using rule-based engine")
        
        return concepts
        
    except Exception as e:
        print(f"❌ Error during concept extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract concepts: {str(e)}"
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
        except:
            # If embedding generation fails, use simple offline embedding
            from app.services.concept_rule_engine import generate_embedding_simple
            embedding = generate_embedding_simple(text_to_embed)
        
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
