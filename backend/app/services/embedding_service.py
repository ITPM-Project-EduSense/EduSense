"""
EduSense - Embedding Service

Generates vector embeddings for text using Google Gemini's embedding models.
Used for semantic search and similarity matching of study concepts.
"""

import math
from typing import List
from fastapi import HTTPException
import google.genai as genai
from app.core.config import settings


# Configure Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def generate_embedding(text: str) -> List[float]:
    """
    Generate a vector embedding for the given text using Gemini's embedding model.
    
    Args:
        text: The text to embed (concept summary, title, or full text)
        
    Returns:
        List of floats representing the embedding vector (typically 768 dimensions)
        
    Raises:
        HTTPException: If embedding generation fails or quota is exceeded
    """
    # Truncate text if too long (embedding models have token limits)
    max_chars = 10000
    if len(text) > max_chars:
        text = text[:max_chars]
    
    # Handle empty text
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Cannot generate embedding for empty text"
        )
    
    try:
        # Call Gemini embedding API
        # Using text-embedding-004 model (latest embedding model from Google)
        result = client.models.embed_content(
            model="text-embedding-004",
            content=text
        )
        
        # Extract the embedding vector
        embedding = result.embeddings[0].values
        
        return embedding
        
    except Exception as e:
        error_message = str(e)
        
        # Handle quota/rate limit errors specifically
        if "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="Embedding API quota exceeded. Please try again later."
            )
        
        # Handle authentication errors
        if "auth" in error_message.lower() or "api key" in error_message.lower():
            raise HTTPException(
                status_code=500,
                detail="Embedding API authentication failed. Please check configuration."
            )
        
        # Generic error
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embedding: {error_message}"
        )


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two embedding vectors.
    
    Cosine similarity measures the cosine of the angle between two vectors,
    ranging from -1 (opposite) to 1 (identical).
    
    Args:
        vec1: First embedding vector
        vec2: Second embedding vector
        
    Returns:
        Similarity score between -1.0 and 1.0 (higher is more similar)
        
    Raises:
        ValueError: If vectors have different dimensions or are empty
    """
    # Validate inputs
    if not vec1 or not vec2:
        raise ValueError("Cannot calculate similarity for empty vectors")
    
    if len(vec1) != len(vec2):
        raise ValueError(
            f"Vectors must have the same dimensions. Got {len(vec1)} and {len(vec2)}"
        )
    
    # Calculate dot product
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    
    # Calculate magnitudes
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    
    # Handle zero vectors
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = dot_product / (magnitude1 * magnitude2)
    
    # Clamp to [-1, 1] to handle floating point errors
    similarity = max(-1.0, min(1.0, similarity))
    
    return similarity


async def find_similar_concepts(
    query_embedding: List[float],
    user_id: str,
    top_k: int = 10,
    min_similarity: float = 0.7
) -> List[dict]:
    """
    Find concepts most similar to a query embedding using cosine similarity.
    
    Args:
        query_embedding: The embedding vector to search for
        user_id: Filter concepts by user ID
        top_k: Maximum number of results to return (default: 10)
        min_similarity: Minimum similarity threshold (default: 0.7)
        
    Returns:
        List of concept dictionaries with similarity scores, sorted by relevance
    """
    from app.models.study_material import Concept
    
    # Fetch all concepts for the user
    # Note: In production, use a vector database (Pinecone, Weaviate, etc.) for efficient search
    concepts = await Concept.find(
        Concept.user_id == user_id
    ).to_list()
    
    # Calculate similarity for each concept
    results = []
    for concept in concepts:
        try:
            similarity = cosine_similarity(query_embedding, concept.embedding)
            
            # Filter by minimum similarity threshold
            if similarity >= min_similarity:
                results.append({
                    "id": str(concept.id),
                    "title": concept.title,
                    "summary": concept.summary,
                    "difficulty": concept.difficulty,
                    "estimated_minutes": concept.estimated_minutes,
                    "material_id": concept.material_id,
                    "similarity": round(similarity, 4),
                    "created_at": concept.created_at.isoformat()
                })
        except ValueError:
            # Skip concepts with incompatible embeddings
            continue
    
    # Sort by similarity (highest first) and limit to top_k
    results.sort(key=lambda x: x["similarity"], reverse=True)
    
    return results[:top_k]


async def generate_query_embedding(query: str) -> List[float]:
    """
    Generate an embedding for a search query.
    
    This is a convenience wrapper around generate_embedding with query-specific preprocessing.
    
    Args:
        query: The search query text
        
    Returns:
        Embedding vector for the query
    """
    # Preprocess query (trim whitespace, basic cleanup)
    query = query.strip()
    
    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty"
        )
    
    # Generate embedding
    return await generate_embedding(query)


async def update_concept_embeddings(user_id: str) -> int:
    """
    Regenerate embeddings for all concepts belonging to a user.
    
    Useful for updating embeddings when switching to a new embedding model.
    
    Args:
        user_id: ID of the user whose concepts to update
        
    Returns:
        Number of concepts updated
    """
    from app.models.study_material import Concept
    
    # Fetch all concepts for the user
    concepts = await Concept.find(
        Concept.user_id == user_id
    ).to_list()
    
    updated_count = 0
    
    for concept in concepts:
        try:
            # Generate new embedding from concept title + summary
            text_to_embed = f"{concept.title}\n\n{concept.summary}"
            new_embedding = await generate_embedding(text_to_embed)
            
            # Update concept with new embedding
            concept.embedding = new_embedding
            await concept.save()
            
            updated_count += 1
            
        except Exception as e:
            # Log error but continue with other concepts
            print(f"Failed to update embedding for concept {concept.id}: {str(e)}")
            continue
    
    return updated_count
