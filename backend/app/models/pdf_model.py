from pydantic import BaseModel
from typing import List

class PDFVector(BaseModel):
    pdf_name: str
    chunk_index: int
    text: str
    embedding: List[float]