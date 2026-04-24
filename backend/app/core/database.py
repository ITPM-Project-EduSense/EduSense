from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# MongoDB client instance
client: AsyncIOMotorClient = None


async def _repair_user_firebase_uid_index(db):
    """Keep firebase_uid unique only for real Firebase-linked accounts."""
    users = db["users"]

    # Legacy password users may have been stored with firebase_uid=null, which
    # conflicts with a plain unique index.
    await users.update_many(
        {"firebase_uid": None},
        {"$unset": {"firebase_uid": ""}},
    )

    indexes = await users.index_information()
    firebase_index = indexes.get("firebase_uid_1")
    expected_partial_filter = {"firebase_uid": {"$type": "string"}}

    if firebase_index:
        if (
            not firebase_index.get("unique")
            or firebase_index.get("partialFilterExpression") != expected_partial_filter
        ):
            await users.drop_index("firebase_uid_1")

    indexes = await users.index_information()
    if "firebase_uid_1" not in indexes:
        await users.create_index(
            "firebase_uid",
            name="firebase_uid_1",
            unique=True,
            partialFilterExpression=expected_partial_filter,
        )


async def connect_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global client
    # debug the URL to ensure it's loaded
    print(f"Using DATABASE_URL={settings.DATABASE_URL}")
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client[settings.DATABASE_NAME]
    await _repair_user_firebase_uid_index(db)

    # 🔥 Import ALL document models here
    from app.models.task import Task
    from app.models.user_model import User
    from app.models.study_material import StudyMaterial, Concept, PdfVector
    from app.models.study_schedule import StudySchedule, SmartSchedule
    from app.models.study_group import StudyGroup
    from app.models.study_group_invite import StudyGroupInvite
    from app.models.smart_scheduling import TaskResource, StudyPlan, StudySession
    from app.models.chat_history import ChatHistory
    from app.models.pdf_model import PdfMaterial, PdfConcept, PdfVectorCollection
    from app.models.quiz_score_model import QuizScore

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
            StudyGroupInvite,
            TaskResource,
            StudyPlan,
            StudySession,
            ChatHistory,
            PdfVectorCollection,
            PdfMaterial,
            PdfConcept,
            QuizScore
        ],
    )

    print(f"Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
