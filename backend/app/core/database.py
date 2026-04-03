from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# MongoDB client instance
client: AsyncIOMotorClient = None


async def connect_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global client
    # debug the URL to ensure it's loaded
    print(f"🔧 Using DATABASE_URL={settings.DATABASE_URL}")
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client[settings.DATABASE_NAME]

    # 🔥 Import ALL document models here
    from app.models.task import Task
    from app.models.user_model import User
    from app.models.study_material import StudyMaterial, Concept, PdfVector
    from app.models.study_schedule import StudySchedule, SmartSchedule
    from app.models.study_group import StudyGroup
    from app.models.smart_scheduling import TaskResource, StudyPlan, StudySession
    from app.models.chat_history import ChatHistory
    from app.models.pdf_model import PdfMaterial, PdfConcept, PdfVectorCollection

    await init_beanie(
        database=db,
        document_models=[
            Task,
            User,
            StudyMaterial,
            Concept,
            PdfVector,
            StudySchedule,
            SmartSchedule,
            StudyGroup,
            TaskResource,
            StudyPlan,
            StudySession,
            ChatHistory,
            PdfVectorCollection,
            PdfMaterial,
            PdfConcept
        ],
    )

    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")