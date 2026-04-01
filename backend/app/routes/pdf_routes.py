
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from typing import Dict, Any, Optional
from pathlib import Path
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.document_service import extract_text_from_pdf, extract_text_from_ppt, extract_text_from_docx
from app.services.ai_summary_service import summarize_material
from app.services.embedding_service import generate_embedding
from app.models.pdf_model import PdfMaterial, PdfConcept
from beanie import PydanticObjectId
import hashlib
import json
import re
from pydantic import BaseModel
from groq import Groq
from app.core.config import settings

router = APIRouter(prefix="/pdf", tags=["Documents"])

class PdfQuizRequest(BaseModel):
    num_questions: int = 8
    difficulty: str = "medium"
    pdf_id: Optional[str] = None

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

@router.get(
    "/materials/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a specific PDF material (content)",
    response_model=Dict[str, Any],
)
async def get_pdf_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        material = await PdfMaterial.get(PydanticObjectId(material_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid material ID.")

    if not material or material.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Material not found or unauthorized.")

    return {
        "success": True,
        "material": {
            "id": str(material.id),
            "filename": material.filename,
            "subject": material.subject,
            "created_at": material.created_at.isoformat(),
            "summary": material.summary,
            "key_points": material.key_points,
            "extracted_text": material.extracted_text,
        },
    }

@router.post(
    "/quiz",
    status_code=status.HTTP_200_OK,
    summary="Generate a quiz from uploaded PDF materials",
    response_model=Dict[str, Any],
)
async def generate_pdf_quiz(
    request: PdfQuizRequest,
    current_user: User = Depends(get_current_user),
):
    groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    if request.pdf_id:
        concepts = await PdfConcept.find(
            PdfConcept.user_id == str(current_user.id),
            PdfConcept.material_id == request.pdf_id,
        ).limit(25).to_list()
    else:
        concepts = await PdfConcept.find(
            PdfConcept.user_id == str(current_user.id),
        ).limit(25).to_list()

    if not concepts:
        raise HTTPException(
            status_code=404,
            detail="No PDF concepts found. Please upload and process a PDF first.",
        )

    context = "\n\n".join(
        f"- {c.title}: {c.summary}"
        for c in concepts
        if (c.title and c.summary)
    )

    system_prompt = (
        "You are an educational quiz generator. "
        "Based on the provided study material, generate multiple-choice questions. "
        "Return ONLY valid JSON: a list of objects, each with: "
        "'question' (string), 'options' (list of 4 strings), "
        "'correct_index' (0-3), 'explanation' (string)."
    )
    user_prompt = (
        f"Generate {request.num_questions} {request.difficulty}-difficulty "
        f"multiple-choice questions from this content:\n\n{context}"
    )

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=2048,
        )
        raw = (response.choices[0].message.content or "").strip()

        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in response")
        quiz = json.loads(match.group())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {e}")

    return {"success": True, "quiz": quiz}

@router.get(
    "/summary/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Get AI-generated summary and concepts for a PDF material",
    response_model=Dict[str, Any],
)
async def get_pdf_material_summary(
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        material = await PdfMaterial.get(PydanticObjectId(material_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid material ID.")

    if not material or material.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Material not found or unauthorized.")

    concepts = await PdfConcept.find(PdfConcept.material_id == material_id).to_list()

    summary_lines = (
        [s.strip() for s in (material.summary or "").split(".") if s.strip()]
        if material.summary
        else []
    )

    return {
        "success": True,
        "filename": material.filename,
        "summary": summary_lines,
        "detailed_summary": material.detailed_summary,
        "key_points": material.key_points,
        "concepts": [
            {"title": c.title, "difficulty": c.difficulty, "summary": c.summary}
            for c in concepts
        ],
    }


@router.post(
    "/summary-full/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Generate a full summary from entire PDF content",
    response_model=Dict[str, Any],
)
async def generate_full_pdf_summary(
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Generates a longer, full-content summary by chunking extracted_text and using Groq.
    Saves the result into PdfMaterial.detailed_summary.
    """
    groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    try:
        material = await PdfMaterial.get(PydanticObjectId(material_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid material ID.")

    if not material or material.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Material not found or unauthorized.")

    text = (material.extracted_text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No extracted text found for this material.")

    # Split into chunks (character-based to keep it simple/reliable)
    chunk_size = 4500
    chunks = [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]
    chunks = chunks[:10]  # safety cap

    chunk_summaries: list[str] = []
    for idx, chunk in enumerate(chunks, start=1):
        prompt = (
            "Summarize this part of the study material clearly for a student.\n"
            "Return Markdown only.\n"
            "Use:\n"
            "- A short heading for the part\n"
            "- 6-10 bullet points\n"
            "- Include key formulas/definitions if present\n\n"
            f"PART {idx}/{len(chunks)}:\n{chunk}"
        )
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You summarize academic text accurately and clearly."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=900,
        )
        chunk_summaries.append((resp.choices[0].message.content or "").strip())

    combine_prompt = (
        "Combine these part-summaries into a single cohesive full summary.\n"
        "Return Markdown only.\n"
        "Output format:\n"
        "# <Title>\n"
        "## Overview (1 short paragraph)\n"
        "## Sectioned Summary (use multiple ### headings)\n"
        "## Key Takeaways (10-15 bullets)\n"
        "## Glossary (optional table)\n\n"
        "PART SUMMARIES:\n\n" + "\n\n---\n\n".join(chunk_summaries)
    )
    resp2 = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You produce structured study summaries."},
            {"role": "user", "content": combine_prompt},
        ],
        temperature=0.2,
        max_tokens=1800,
    )

    detailed = (resp2.choices[0].message.content or "").strip()
    material.detailed_summary = detailed
    await material.save()

    return {
        "success": True,
        "material_id": str(material.id),
        "filename": material.filename,
        "detailed_summary": detailed,
    }

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