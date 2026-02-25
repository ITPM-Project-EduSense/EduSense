"""
EduSense - Rule-Based Concept Extraction Engine

Extracts concepts from study material text using pattern matching,
text analysis, and heuristics - NO AI API REQUIRED.

Features:
- Extract headings and sections
- Identify key phrases and terminology
- Determine difficulty based on vocabulary complexity
- Estimate study time based on content length
- Works entirely offline
"""

import re
from typing import List, Dict
from collections import Counter
import math


# Common academic vocabulary by difficulty level
EASY_KEYWORDS = {
    'definition', 'introduction', 'basic', 'simple', 'meaning', 'what is',
    'example', 'describe', 'explain', 'overview', 'summary', 'concept',
    'understand', 'learn', 'identify', 'recognize', 'basic', 'fundamental'
}

MEDIUM_KEYWORDS = {
    'analyze', 'compare', 'contrast', 'relationship', 'process', 'method',
    'technique', 'approach', 'framework', 'model', 'theory', 'principle',
    'mechanism', 'structure', 'function', 'system', 'component', 'interaction'
}

HARD_KEYWORDS = {
    'theorem', 'proof', 'derivation', 'complex', 'advanced', 'sophisticated',
    'optimization', 'algorithm', 'implementation', 'architecture', 'paradox',
    'anomaly', 'exception', 'edge case', 'critical analysis', 'synthesis',
    'hypothesis', 'conjecture', 'mathematical', 'statistical', 'abstract'
}


def extract_concepts_from_text(text: str) -> List[Dict]:
    """
    Extract concepts from study material using rule-based analysis.
    
    Args:
        text: The extracted text from a study material
        
    Returns:
        List of concept dictionaries with title, summary, difficulty, estimated_minutes
    """
    if not text or len(text.strip()) == 0:
        return []
    
    concepts = []
    
    # Step 1: Extract concepts from headings and sections
    heading_concepts = _extract_from_headings(text)
    concepts.extend(heading_concepts)
    
    # Step 2: Extract key phrases from paragraphs
    phrase_concepts = _extract_key_phrases(text)
    concepts.extend(phrase_concepts)
    
    # Step 3: Remove duplicates and limit to 15-20 concepts
    concepts = _deduplicate_concepts(concepts)
    concepts = concepts[:20]
    
    # Step 4: Analyze and score each concept
    for concept in concepts:
        # Determine difficulty
        concept['difficulty'] = _determine_difficulty(concept['title'] + ' ' + concept['summary'])
        
        # Estimate study time based on summary length and difficulty
        concept['estimated_minutes'] = _estimate_study_time(
            concept['summary'],
            concept['difficulty']
        )
    
    # Step 5: Sort by difficulty (easy to hard) for logical learning order
    difficulty_order = {'easy': 0, 'medium': 1, 'hard': 2}
    concepts.sort(key=lambda c: difficulty_order.get(c['difficulty'], 1))
    
    return concepts


def _extract_from_headings(text: str) -> List[Dict]:
    """Extract concepts from heading text."""
    concepts = []
    
    # Match headings (lines with # or lines followed by underlines)
    heading_patterns = [
        r'^#+\s+(.+)$',  # Markdown headings
        r'^([A-Z][A-Za-z\s\d&-]{3,})\s*\n[-=]{3,}$',  # Underlined headings
    ]
    
    for pattern in heading_patterns:
        matches = re.finditer(pattern, text, re.MULTILINE)
        for match in matches:
            heading = match.group(1).strip()
            
            # Skip generic headings
            if heading.lower() in ['introduction', 'contents', 'table of contents', 'chapter', 'section']:
                continue
            
            # Create concept from heading
            if len(heading) > 3:
                concepts.append({
                    'title': heading[:100],
                    'summary': f"Key topic: {heading}",
                    'difficulty': 'medium'  # Will be refined later
                })
    
    return concepts


def _extract_key_phrases(text: str) -> List[Dict]:
    """Extract key phrases from text using pattern matching."""
    concepts = []
    
    # Split into sentences for analysis
    sentences = re.split(r'[.!?]\s+', text)
    
    phrase_dict = {}
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 10:
            continue
        
        # Look for sentences that define or introduce concepts
        # Pattern 1: "X is..." or "X refers to..."
        match = re.match(r'^([A-Z][A-Za-z\s&-]+?)\s+(is|refers to|means|denotes|represents)\s+(.{20,150})', sentence)
        if match:
            phrase = match.group(1).strip()
            definition = match.group(3).strip()[:150]
            
            if phrase not in phrase_dict and len(phrase) > 3:
                phrase_dict[phrase] = definition
        
        # Pattern 2: "The X of Y" or "X process"
        match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(of|process|method|concept|principle)', sentence)
        if match:
            phrase = match.group(1).strip()
            if phrase not in phrase_dict and len(phrase) > 3 and len(phrase) < 50:
                phrase_dict[phrase] = sentence[:150]
    
    # Convert to concepts
    for phrase, definition in list(phrase_dict.items())[:15]:
        concepts.append({
            'title': phrase,
            'summary': definition,
            'difficulty': 'medium'
        })
    
    return concepts


def _deduplicate_concepts(concepts: List[Dict]) -> List[Dict]:
    """Remove duplicate and very similar concepts."""
    unique = []
    seen_titles = set()
    
    for concept in concepts:
        title_lower = concept['title'].lower()
        
        # Check if we've seen a similar title
        is_duplicate = False
        for seen in seen_titles:
            if _similarity_score(title_lower, seen) > 0.8:
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique.append(concept)
            seen_titles.add(title_lower)
    
    return unique


def _similarity_score(str1: str, str2: str) -> float:
    """Calculate simple similarity between two strings."""
    # Simple Jaccard similarity
    set1 = set(str1.split())
    set2 = set(str2.split())
    
    if len(set1) == 0 or len(set2) == 0:
        return 0.0
    
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    
    return intersection / union if union > 0 else 0.0


def _determine_difficulty(text: str) -> str:
    """Determine concept difficulty based on vocabulary."""
    text_lower = text.lower()
    words = set(text_lower.split())
    
    hard_count = len(words & {w.lower() for w in HARD_KEYWORDS})
    medium_count = len(words & {w.lower() for w in MEDIUM_KEYWORDS})
    easy_count = len(words & {w.lower() for w in EASY_KEYWORDS})
    
    # Calculate vocabulary complexity (average word length)
    avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
    
    # Score compounds
    hard_score = hard_count * 3 + (avg_word_length / 5)
    medium_score = medium_count * 2
    easy_score = easy_count
    
    if hard_score > medium_score and hard_score > easy_score:
        return 'hard'
    elif medium_score > easy_score:
        return 'medium'
    else:
        return 'easy'


def _estimate_study_time(text: str, difficulty: str) -> int:
    """Estimate study time in minutes based on text length and difficulty."""
    # Base time: ~3 minutes per 100 words
    word_count = len(text.split())
    base_minutes = max(5, (word_count / 100) * 3)
    
    # Adjust by difficulty
    difficulty_multiplier = {
        'easy': 1.0,
        'medium': 1.5,
        'hard': 2.0
    }
    
    estimated = int(base_minutes * difficulty_multiplier.get(difficulty, 1.0))
    
    # Clamp to 5-60 minutes
    return max(5, min(60, estimated))


def generate_embedding_simple(text: str) -> List[float]:
    """
    Generate a simple embedding for a text string using TF-IDF-like approach.
    This is a lightweight alternative to ML models.
    
    Returns a 100-dimensional vector.
    """
    # Simple approach: character n-gram frequency
    text = text.lower()
    ngrams = []
    
    # Extract 2-grams
    for i in range(len(text) - 1):
        ngrams.append(text[i:i+2])
    
    if not ngrams:
        return [0.0] * 100
    
    # Count frequencies
    ngram_counts = Counter(ngrams)
    sorted_ngrams = sorted(ngram_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Create 100-dimensional vector
    embedding = [0.0] * 100
    
    for i, (ngram, count) in enumerate(sorted_ngrams[:100]):
        # Normalize by frequency
        embedding[i] = min(1.0, count / 10.0)
    
    # Fill remaining with small random-like values based on text hash
    hash_val = hash(text) % 1000
    for i in range(len(sorted_ngrams), 100):
        embedding[i] = (hash_val % (i + 1)) / 1000.0
    
    return embedding
