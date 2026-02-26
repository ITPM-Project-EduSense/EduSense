from fastapi import APIRouter, File, UploadFile
from app.services.pdf_service import extract_text_from_pdf
from app.services.chunk_service import chunk_text
from app.core.database import vector_collection
from app.services.embedding_service import generate_embedding
from app.models.pdf_model import PDFVector
import os

router = APIRouter()
@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"

    # Save file temporarily
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    text = extract_text_from_pdf(file_path)

    if not text:
        return {"error": "No text extracted from PDF"}

    # Split into chunks
    chunks = chunk_text(text)
    print(chunks)
    stored_count = 0

    for i, chunk in enumerate(chunks):
        try:
            embedding = generate_embedding(chunk)
            if embedding is not None:
                pdf_vector = PDFVector(
                    pdf_name=file.filename,
                    chunk_index=i,
                    text=chunk,
                    embedding=embedding
                )

            vector_collection.insert_one(pdf_vector.model_dump())
            stored_count += 1
        except Exception as e:
            print(f"Error processing chunk {i}: {e}")   


    os.remove(file_path)

    return {
        "message": "PDF processed successfully",
        "chunks_stored": stored_count
    }

@router.get("/test")
async def test_endpoint():
    return {"message": "PDF routes are working!"}