from datetime import datetime
from typing import List, Literal
from beanie import Document
from pydantic import Field


class StudyMaterial(Document):
    """
    MongoDB document model for uploaded study materials.
    Stores the extracted text content from uploaded documents.
    """

    user_id: str = Field(..., description="ID of the user who uploaded the material")
    filename: str = Field(..., min_length=1, max_length=255, description="Original filename of the uploaded document")
    extracted_text: str = Field(..., description="Text content extracted from the document")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the material was uploaded")

    class Settings:
        name = "study_materials"  # MongoDB collection name


class Concept(Document):
    """
    MongoDB document model for extracted concepts from study materials.
    Stores AI-analyzed concepts with embeddings for intelligent retrieval.
    """

    user_id: str = Field(..., description="ID of the user who owns this concept")
    material_id: str = Field(..., description="Reference to the StudyMaterial document this concept was extracted from")
    title: str = Field(..., min_length=1, max_length=200, description="Concept title or heading")
    summary: str = Field(..., description="AI-generated summary of the concept")
    difficulty: Literal["easy", "medium", "hard"] = Field(..., description="Difficulty level of the concept")
    estimated_minutes: int = Field(..., ge=1, description="Estimated time in minutes to study this concept")
    embedding: List[float] = Field(..., description="Vector embedding for semantic search")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the concept was extracted")

    class Settings:
        name = "concepts"  # MongoDB collection name
