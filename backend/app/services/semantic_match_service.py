"""
EduSense - Semantic Matching Service

Matches academic tasks to relevant study concepts using semantic similarity.
Helps students identify which materials to review for upcoming assignments/exams.
"""

from typing import List, Tuple
from app.models.study_material import Concept
from app.services.embedding_service import generate_embedding, cosine_similarity


async def match_task_to_concepts(
    task_title: str,
    user_id: str,
    top_k: int = 10,
    min_similarity: float = 0.3
) -> List[Concept]:
    """
    Find study concepts most relevant to a given task using semantic similarity.
    
    This function helps students identify which concepts they should review
    when preparing for a specific assignment, quiz, or exam.
    
    Args:
        task_title: The title/description of the task to match
        user_id: ID of the user (to filter their concepts)
        top_k: Maximum number of concepts to return (default: 10)
        min_similarity: Minimum similarity threshold to include (default: 0.3)
        
    Returns:
        List of Concept objects, sorted by relevance (highest similarity first)
        
    Example:
        >>> concepts = await match_task_to_concepts(
        ...     "Data Structures Final Exam",
        ...     user_id="123"
        ... )
        >>> for concept in concepts:
        ...     print(f"{concept.title} - {concept.difficulty}")
    """
    # Step 1: Generate embedding for the task title
    task_embedding = await generate_embedding(task_title)
    
    # Step 2: Fetch all concepts for the user from database
    user_concepts = await Concept.find(
        Concept.user_id == user_id
    ).to_list()
    
    # Handle case where user has no concepts yet
    if not user_concepts:
        return []
    
    # Step 3: Compute cosine similarity for each concept
    concept_similarities: List[Tuple[Concept, float]] = []
    
    for concept in user_concepts:
        try:
            # Calculate similarity between task and concept
            similarity = cosine_similarity(task_embedding, concept.embedding)
            
            # Only include concepts above the minimum similarity threshold
            if similarity >= min_similarity:
                concept_similarities.append((concept, similarity))
                
        except (ValueError, Exception):
            # Skip concepts with invalid embeddings
            continue
    
    # Step 4: Sort by similarity in descending order (most relevant first)
    concept_similarities.sort(key=lambda x: x[1], reverse=True)
    
    # Step 5: Return top K concept objects (without similarity scores)
    matched_concepts = [concept for concept, _ in concept_similarities[:top_k]]
    
    return matched_concepts


async def match_task_to_concepts_with_scores(
    task_title: str,
    user_id: str,
    subject: str = None,
    top_k: int = 10,
    min_similarity: float = 0.3
) -> List[dict]:
    """
    Find study concepts most relevant to a task, including similarity scores.
    
    Falls back to keyword matching when embeddings are not available.
    
    Args:
        task_title: The title/description of the task to match
        user_id: ID of the user (to filter their concepts)
        subject: Optional subject filter for better matching
        top_k: Maximum number of concepts to return (default: 10)
        min_similarity: Minimum similarity threshold to include (default: 0.3)
        
    Returns:
        List of dictionaries with concept data and similarity scores
    """
    # Generate embedding for the task title
    task_embedding = await generate_embedding(task_title)
    
    # Build query
    query = Concept.find(Concept.user_id == user_id)
    if subject:
        query = query.find(Concept.subject == subject)
    
    # Fetch concepts
    user_concepts = await query.to_list()
    
    if not user_concepts:
        return []
    
    # If no embeddings available (quota exceeded), use keyword matching
    if not task_embedding:
        return _match_by_keywords(task_title, subject, user_concepts, top_k)
    
    # Compute similarities and build results
    results = []
    
    for concept in user_concepts:
        # Skip concepts without embeddings
        if not concept.embedding:
            continue
            
        try:
            similarity = cosine_similarity(task_embedding, concept.embedding)
            
            if similarity >= min_similarity:
                results.append({
                    "id": str(concept.id),
                    "title": concept.title,
                    "summary": concept.summary,
                    "difficulty": concept.difficulty,
                    "estimated_minutes": concept.estimated_minutes,
                    "material_id": concept.material_id,
                    "subject": concept.subject,
                    "similarity_score": round(similarity, 4),
                    "relevance_percentage": round(similarity * 100, 2),
                    "created_at": concept.created_at.isoformat()
                })
                
        except (ValueError, Exception):
            continue
    
    # If no semantic matches found, fall back to keyword matching
    if not results:
        return _match_by_keywords(task_title, subject, user_concepts, top_k)
    
    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return results[:top_k]


def _match_by_keywords(task_title: str, subject: str, concepts: List[Concept], top_k: int) -> List[dict]:
    """
    Fallback keyword-based matching when embeddings are not available.
    
    Args:
        task_title: The task title to match
        subject: Subject filter
        concepts: List of concepts to match against
        top_k: Number of results to return
        
    Returns:
        List of matched concepts with keyword-based scores
    """
    # Tokenize task title (simple word splitting)
    task_words = set(task_title.lower().split())
    
    results = []
    for concept in concepts:
        # Calculate keyword overlap score
        concept_words = set(concept.title.lower().split())
        if concept.summary:
            concept_words.update(concept.summary.lower().split()[:50])  # First 50 words of summary
        
        # Calculate Jaccard similarity (intersection over union)
        intersection = len(task_words & concept_words)
        union = len(task_words | concept_words)
        
        if union > 0:
            keyword_score = intersection / union
            
            # Boost score if subject matches
            if subject and concept.subject == subject:
                keyword_score *= 1.5
            
            # Only include if there's some overlap
            if intersection > 0:
                results.append({
                    "id": str(concept.id),
                    "title": concept.title,
                    "summary": concept.summary,
                    "difficulty": concept.difficulty,
                    "estimated_minutes": concept.estimated_minutes,
                    "material_id": concept.material_id,
                    "subject": concept.subject,
                    "similarity_score": round(keyword_score, 4),
                    "relevance_percentage": round(keyword_score * 100, 2),
                    "created_at": concept.created_at.isoformat()
                })
    
    # Sort by score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return results[:top_k]


async def get_concept_recommendations(
    user_id: str,
    difficulty_filter: str = None,
    max_minutes: int = None,
    limit: int = 20
) -> List[Concept]:
    """
    Get recommended concepts for a user based on difficulty and time constraints.
    
    Useful for suggesting what to study next based on available time and skill level.
    
    Args:
        user_id: ID of the user
        difficulty_filter: Filter by "easy", "medium", or "hard" (optional)
        max_minutes: Maximum study time available (optional)
        limit: Maximum number of concepts to return (default: 20)
        
    Returns:
        List of Concept objects matching the criteria
    """
    # Build query
    query = Concept.user_id == user_id
    
    # Add difficulty filter if specified
    if difficulty_filter and difficulty_filter in ["easy", "medium", "hard"]:
        query = query & (Concept.difficulty == difficulty_filter)
    
    # Fetch concepts
    concepts = await Concept.find(query).to_list()
    
    # Filter by time if specified
    if max_minutes is not None:
        concepts = [c for c in concepts if c.estimated_minutes <= max_minutes]
    
    # Sort by difficulty (easy first) and estimated time
    difficulty_order = {"easy": 1, "medium": 2, "hard": 3}
    concepts.sort(key=lambda c: (difficulty_order.get(c.difficulty, 2), c.estimated_minutes))
    
    return concepts[:limit]


async def find_related_concepts(
    concept_id: str,
    user_id: str,
    top_k: int = 5
) -> List[Concept]:
    """
    Find concepts similar to a given concept.
    
    Useful for suggesting related topics to study together.
    
    Args:
        concept_id: ID of the reference concept
        user_id: ID of the user (for authorization)
        top_k: Number of similar concepts to return (default: 5)
        
    Returns:
        List of related Concept objects
    """
    from beanie import PydanticObjectId
    
    # Fetch the reference concept
    try:
        reference_concept = await Concept.get(PydanticObjectId(concept_id))
    except:
        return []
    
    if not reference_concept or reference_concept.user_id != user_id:
        return []
    
    # Fetch all other concepts for the user
    other_concepts = await Concept.find(
        Concept.user_id == user_id
    ).to_list()
    
    # Remove the reference concept itself
    other_concepts = [c for c in other_concepts if str(c.id) != concept_id]
    
    if not other_concepts:
        return []
    
    # Calculate similarities
    similarities = []
    for concept in other_concepts:
        try:
            similarity = cosine_similarity(reference_concept.embedding, concept.embedding)
            similarities.append((concept, similarity))
        except (ValueError, Exception):
            continue
    
    # Sort by similarity and return top K
    similarities.sort(key=lambda x: x[1], reverse=True)
    related = [concept for concept, _ in similarities[:top_k]]
    
    return related
