from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import connect_db, close_db
from app.routes.task_routes import router as task_router
from app.routes.schedule_routes import router as schedule_router
from app.routes.auth_routes import router as auth_router
from app.routes.users_routes import router as users_router


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


# -------------------------------
# CORS Configuration
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
    ],
    allow_credentials=True,  # Required for httpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Register Routers
# -------------------------------
app.include_router(task_router, prefix="/api", tags=["Tasks"])
app.include_router(schedule_router, prefix="/api", tags=["Schedule"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])


# -------------------------------
# Health Check Endpoint
# -------------------------------
@app.get("/", tags=["Health"])
async def health_check():
    """
    Simple endpoint to verify backend is running.
    """
    return {"status": "EduSense backend running"}