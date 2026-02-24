from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# MongoDB client instance
client: AsyncIOMotorClient = None


async def connect_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global client
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client[settings.DATABASE_NAME]

    # Import all document models here
    from app.models.task import Task

    await init_beanie(
        database=db,
        document_models=[Task]
    )
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")