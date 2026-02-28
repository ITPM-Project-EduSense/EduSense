from datetime import datetime
from typing import List, Literal, Optional
from beanie import Document
from pydantic import Field


class StudyMaterial(Document):
    """
    MongoDB document model for uploaded study materials.
    Stores the extracted text content and AI-generated summaries from documents.
    """

    user_id: str = Field(..., description="ID of the user who uploaded the material")
    subject: str = Field(..., min_length=1, max_length=100, description="Subject/course this material belongs to")
    filename: str = Field(..., min_length=1, max_length=255, description="Original filename of the uploaded document")
    extracted_text: str = Field(..., description="Text content extracted from the document")
    summary: str = Field(default="", description="AI-generated summary of the material")
    key_points: List[str] = Field(default_factory=list, description="Key points extracted from the material")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the material was uploaded")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the material was last updated")

    class Settings:
        name = "study_materials"  # MongoDB collection name


class Concept(Document):
    """
    MongoDB document model for extracted concepts from study materials.
    Stores AI-analyzed concepts with embeddings for semantic matching and intelligent retrieval.
    """

    user_id: str = Field(..., description="ID of the user who owns this concept")
    material_id: str = Field(..., description="Reference to the StudyMaterial document this concept was extracted from")
    subject: str = Field(..., min_length=1, max_length=100, description="Subject/course this concept belongs to")
    title: str = Field(..., min_length=1, max_length=200, description="Concept title or heading")
    summary: str = Field(..., description="AI-generated summary of the concept")
    difficulty: Literal["easy", "medium", "hard"] = Field(..., description="Difficulty level of the concept")
    estimated_minutes: int = Field(..., ge=1, description="Estimated time in minutes to study this concept")
    embedding: List[float] = Field(default_factory=list, description="Vector embedding for semantic search (empty if quota exceeded)")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the concept was extracted")

    class Settings:
        name = "concepts"  # MongoDB collection name
