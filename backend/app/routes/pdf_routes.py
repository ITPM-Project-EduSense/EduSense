
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from typing import Dict, Any
from pathlib import Path
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.document_service import extract_text_from_pdf, extract_text_from_ppt, extract_text_from_docx
from app.services.ai_summary_service import summarize_material
from app.services.embedding_service import generate_embedding
from app.models.pdf_model import PdfMaterial, PdfConcept
from beanie import PydanticObjectId
import hashlib

router = APIRouter(prefix="/pdf", tags=["Documents"])

@router.get(
    "/materials",
    summary="Get all PDF materials for current user",
    response_model=Dict[str, Any],
)
async def get_pdf_materials(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    try:
        docs = (
            await PdfMaterial.find(PdfMaterial.user_id == str(current_user.id))
            .sort("-created_at")
            .limit(max(1, min(limit, 200)))
            .to_list()
        )
        return {
            "success": True,
            "count": len(docs),
            "materials": [
                {
                    "id": str(d.id),
                    "filename": d.filename,
                    "subject": d.subject,
                    "created_at": d.created_at.isoformat(),
                    "text_length": len(d.extracted_text or ""),
                }
                for d in docs
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve PDF materials: {str(e)}",
        )

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
    try:
        # Step 1: Extract text from the uploaded document and save PdfMaterial
        file_ext = Path(file.filename).suffix.lower()
        extractors = {
            ".pdf": extract_text_from_pdf,
            ".pptx": extract_text_from_ppt,
            ".ppt": extract_text_from_ppt,
            ".docx": extract_text_from_docx,
            ".doc": extract_text_from_docx,
        }

        if file_ext not in extractors:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_ext}. Supported types: .pdf, .pptx, .ppt, .docx, .doc",
            )

        file_bytes = await file.read()

        # 🔥 ADD THIS (duplicate check)
        file_hash = hashlib.md5(file_bytes).hexdigest()

        existing = await PdfMaterial.find_one(
            PdfMaterial.file_hash == file_hash,
            PdfMaterial.user_id == str(current_user.id)
        )

        if existing:
            return {
                "success": True,
                "message": "PDF already uploaded. Skipping save.",
                "material_id": str(existing.id),
                "filename": existing.filename,
                "subject": existing.subject,
                "summary": existing.summary,
                "key_points_count": len(existing.key_points),
                "concepts_extracted": 0,
                "concepts": []
            }
        # 🔥 END ADD

        extracted_text = extractors[file_ext](file_bytes)

        # Limit text length
        if len(extracted_text) > 50000:
            extracted_text = extracted_text[:50000] + "\n\n[Content truncated due to length...]"

        material = PdfMaterial(
            user_id=str(current_user.id),
            subject=subject,
            filename=file.filename,
            extracted_text=extracted_text,
            file_hash=file_hash  # 🔥 ADD THIS
        )

        await material.insert()
        material_id = str(material.id)

        # Step 2: AI summary
        try:
            ai_result = await summarize_material(
                text=material.extracted_text,
                subject=subject,
                filename=file.filename
            )

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

        # Step 3: Save concepts
        saved_concepts = []

        for concept_data in ai_result.get("concepts", []):
            try:
                embed_text = f"{concept_data['title']}\n\n{concept_data['summary']}"
                embedding = await generate_embedding(embed_text)

                concept = PdfConcept(
                    user_id=str(current_user.id),
                    material_id=material_id,
                    subject=subject,
                    title=concept_data["title"],
                    summary=concept_data["summary"],
                    difficulty=concept_data.get("difficulty", "medium"),
                    estimated_minutes=concept_data.get("estimated_minutes", 30),
                    embedding=embedding
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

        # Step 4: Return response
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