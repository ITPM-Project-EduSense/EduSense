from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db
from app.routes.task_routes import router as task_router
from app.routes.schedule_routes import router as schedule_router
from app.routes.auth_routes import router as auth_router




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB
    await connect_db()
    yield
    # Shutdown: close MongoDB connection
    await close_db()


app = FastAPI(
    title="EduSense API",
    version="1.0.0",
    lifespan=lifespan
)

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(task_router, prefix="/api")
app.include_router(schedule_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "EduSense backend running"}