from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.database import connect_db, close_db
from app.core.firebase_admin import initialize_firebase_admin
from app.routes.task_routes import router as task_router
from app.routes.schedule_routes import router as schedule_router
from app.routes.auth_routes import router as auth_router
from app.routes.users_routes import router as users_router
from app.routes.document_route import router as document_router
from app.routes.group_routes import router as group_router
from app.routes.meeting_routes import router as meeting_router
from app.routes.smart_schedule_routes import router as smart_schedule_router
from app.routes.chat_route import router as chat_router
from app.routes.pdf_routes import router as pdf_router
from app.routes.quiz_score_routes import router as quiz_score_router

# -------------------------------
# Lifespan (Startup / Shutdown)
# -------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events.

    - Connects to MongoDB on startup
    - Closes MongoDB connection on shutdown
    """
    print("🚀 Starting EduSense Backend...")
    initialize_firebase_admin()
    await connect_db()

    yield  # Application runs here

    print("🛑 Shutting down EduSense Backend...")
    await close_db()


# -------------------------------
# FastAPI App Initialization
# -------------------------------
app = FastAPI(
    title="EduSense API",
    version="1.0.0",
    description="AI-Powered Student Productivity Platform Backend",
    lifespan=lifespan
)


ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}


def _cors_error_headers(request: Request) -> dict:
    """Attach CORS headers to error responses so browser can read the real error."""
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


# -------------------------------
# CORS Configuration
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,  # Required for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# -------------------------------
# Global Exception Handler (ensures CORS on errors)
# -------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with proper CORS headers."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_error_headers(request),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper CORS headers."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=_cors_error_headers(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch unhandled exceptions and return a proper JSON response.
    This ensures CORS headers are applied even when errors occur.
    """
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=_cors_error_headers(request),
    )


# -------------------------------
# Register Routers
# -------------------------------
app.include_router(task_router, prefix="/api", tags=["Tasks"])
app.include_router(schedule_router, prefix="/api", tags=["Schedule"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(document_router, prefix="/api", tags=["Documents"])
app.include_router(group_router, prefix="/api", tags=["Groups"])
app.include_router(meeting_router, prefix="/api", tags=["Group Meetings"])
app.include_router(smart_schedule_router, prefix="/api", tags=["Smart Scheduling"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(pdf_router, prefix="/api", tags=["Pdf"])
app.include_router(quiz_score_router, prefix="/api", tags=["Quiz Scores"])

# -------------------------------
# Health Check Endpoint
# -------------------------------
@app.get("/", tags=["Health"])
async def health_check():
    """
    Simple endpoint to verify backend is running.
    """
    return {"status": "EduSense backend running"}