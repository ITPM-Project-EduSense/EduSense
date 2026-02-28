"""
EduSense - Document Upload Routes

Handles document upload, text extraction, AI summarization, and concept extraction.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from typing import Dict, Any
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.document_service import process_uploaded_document, get_user_materials, get_material_by_id
from app.services.ai_summary_service import summarize_material
from app.services.embedding_service import generate_embedding
from app.models.study_material import StudyMaterial, Concept
from beanie import PydanticObjectId

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a study document",
    response_model=Dict[str, Any]
)
async def upload_document(
    file: UploadFile = File(..., description="Study material file (PDF, DOCX, or PPTX)"),
    subject: str = Form(..., description="Subject/course name for this material"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a study document and automatically extract concepts using AI.
    
    Process:
    1. Accepts file upload (.pdf, .docx, .pptx) + subject
    2. Extracts text content from the document
    3. Uses AI to generate summary, key points, and concepts
    4. Generates embeddings for each concept (with fallback if quota exceeded)
    5. Saves StudyMaterial + Concept documents to database
    
    Returns:
        Success message with material ID, summary, and extracted concepts
        
    Raises:
        400: Unsupported file type or extraction error
        401: Not authenticated
        500: Processing error
    """
    try:
        # Step 1: Process uploaded document (extract text and save StudyMaterial)
        material_id = await process_uploaded_document(
            file=file,
            user_id=str(current_user.id),
            subject=subject
        )
        
        # Step 2: Fetch the saved material
        material = await StudyMaterial.get(PydanticObjectId(material_id))
        if not material:
            raise HTTPException(status_code=404, detail="Material not found after upload")
        
        # Step 3: Generate AI summary, key points, and concepts
        try:
            ai_result = await summarize_material(
                text=material.extracted_text,
                subject=subject,
                filename=file.filename
            )
            
            # Update material with summary and key points
            material.summary = ai_result.get("summary", "")
            material.key_points = ai_result.get("key_points", [])
            await material.save()
            
        except Exception as e:
            print(f"⚠️ AI summarization failed: {e}")
            ai_result = {
                "summary": "Summary not available",
                "key_points": [],
                "concepts": []
            }
        
        # Step 4: Save concepts with embeddings
        saved_concepts = []
        for concept_data in ai_result.get("concepts", []):
            try:
                # Generate embedding for concept (title + summary)
                embed_text = f"{concept_data['title']}\n\n{concept_data['summary']}"
                embedding = await generate_embedding(embed_text)
                
                # Create and save concept
                concept = Concept(
                    user_id=str(current_user.id),
                    material_id=material_id,
                    subject=subject,
                    title=concept_data["title"],
                    summary=concept_data["summary"],
                    difficulty=concept_data.get("difficulty", "medium"),
                    estimated_minutes=concept_data.get("estimated_minutes", 30),
                    embedding=embedding  # May be empty list if quota exceeded
                )
                await concept.insert()
                
                saved_concepts.append({
                    "id": str(concept.id),
                    "title": concept.title,
                    "difficulty": concept.difficulty,
                    "estimated_minutes": concept.estimated_minutes
                })
                
            except Exception as e:
                print(f"⚠️ Failed to save concept {concept_data.get('title')}: {e}")
                continue
        
        # Step 5: Return success response
        return {
            "success": True,
            "message": "Document uploaded and processed successfully",
            "material_id": material_id,
            "filename": file.filename,
            "subject": subject,
            "summary": ai_result.get("summary", ""),
            "key_points_count": len(ai_result.get("key_points", [])),
            "concepts_extracted": len(saved_concepts),
            "concepts": saved_concepts
        }
        
    except HTTPException as he:
        raise he
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get(
    "/materials",
    summary="Get all study materials for current user",
    response_model=Dict[str, Any]
)
async def get_materials(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """
    Retrieve all study materials uploaded by the current user.
    
    Args:
        limit: Maximum number of materials to return (default: 50)
        
    Returns:
        List of study materials with metadata
    """
    try:
        materials = await get_user_materials(
            user_id=str(current_user.id),
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(materials),
            "materials": [
                {
                    "id": str(material.id),
                    "filename": material.filename,
                    "created_at": material.created_at.isoformat(),
                    "text_length": len(material.extracted_text)
                }
                for material in materials
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve materials: {str(e)}"
        )


@router.get(
    "/materials/{material_id}",
    summary="Get a specific study material",
    response_model=Dict[str, Any]
)
async def get_material(
    material_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a specific study material by ID.
    
    Includes full extracted text content.
    
    Args:
        material_id: ID of the study material
        
    Returns:
        Study material with full content
        
    Raises:
        404: Material not found or unauthorized
    """
    material = await get_material_by_id(
        material_id=material_id,
        user_id=str(current_user.id)
    )
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study material not found or unauthorized"
        )
    
    return {
        "success": True,
        "material": {
            "id": str(material.id),
            "filename": material.filename,
            "extracted_text": material.extracted_text,
            "created_at": material.created_at.isoformat(),
            "user_id": material.user_id
        }
    }


@router.post(
    "/materials/{material_id}/extract-concepts",
    summary="Re-extract concepts from an existing material",
    response_model=Dict[str, Any]
)
async def reextract_concepts(
    material_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Re-run concept extraction on an existing study material.
    
    Useful if:
    - Initial concept extraction failed
    - AI model improved and you want updated concepts
    - Original extraction had errors
    
    Args:
        material_id: ID of the study material
        
    Returns:
        Newly extracted concepts
        
    Raises:
        404: Material not found or unauthorized
        500: Concept extraction failed
    """
    try:
        # Fetch material
        material = await get_material_by_id(material_id, str(current_user.id))
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Re-run AI summary
        ai_result = await summarize_material(
            text=material.extracted_text,
            subject=material.subject,
            filename=material.filename
        )
        
        # Update material
        material.summary = ai_result.get("summary", "")
        material.key_points = ai_result.get("key_points", [])
        await material.save()
        
        # Delete old concepts for this material
        old_concepts = await Concept.find(Concept.material_id == material_id).to_list()
        for concept in old_concepts:
            await concept.delete()
        
        # Save new concepts
        saved_concepts = []
        for concept_data in ai_result.get("concepts", []):
            embed_text = f"{concept_data['title']}\n\n{concept_data['summary']}"
            embedding = await generate_embedding(embed_text)
            
            concept = Concept(
                user_id=str(current_user.id),
                material_id=material_id,
                subject=material.subject,
                title=concept_data["title"],
                summary=concept_data["summary"],
                difficulty=concept_data.get("difficulty", "medium"),
                estimated_minutes=concept_data.get("estimated_minutes", 30),
                embedding=embedding
            )
            await concept.insert()
            saved_concepts.append({"id": str(concept.id), "title": concept.title})
        
        return {
            "success": True,
            "message": "Concepts re-extracted successfully",
            "material_id": material_id,
            "concepts_extracted": len(saved_concepts),
            "concepts": saved_concepts
        }
        
    except HTTPException as he:
        raise he
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract concepts: {str(e)}"
        )


@router.get(
    "/status",
    summary="Get material status for a subject",
    response_model=Dict[str, Any]
)
async def get_material_status(
    subject: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of uploaded materials and concepts for the user.
    Optionally filter by subject.
    
    Args:
        subject: Optional subject filter
        
    Returns:
        Material counts, concept counts, and last processed date
    """
    try:
        # Build query
        material_query = StudyMaterial.find(StudyMaterial.user_id == str(current_user.id))
        concept_query = Concept.find(Concept.user_id == str(current_user.id))
        
        if subject:
            material_query = material_query.find(StudyMaterial.subject == subject)
            concept_query = concept_query.find(Concept.subject == subject)
        
        # Get counts
        materials = await material_query.to_list()
        concepts = await concept_query.to_list()
        
        # Get last processed date
        last_material_date = None
        if materials:
            latest_material = max(materials, key=lambda m: m.created_at)
            last_material_date = latest_material.created_at.isoformat()
        
        return {
            "success": True,
            "subject": subject,
            "materials_count": len(materials),
            "concepts_count": len(concepts),
            "last_processed_date": last_material_date,
            "ready": len(materials) > 0 and len(concepts) > 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get material status: {str(e)}"
        )
