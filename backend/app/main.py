from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import pdf_routes

app = FastAPI(
    title="EduSense API",
    version="1.0.0"
)

app.include_router(pdf_routes.router)

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "EduSense backend running"}
