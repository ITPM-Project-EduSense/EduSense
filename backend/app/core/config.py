import os
from pathlib import Path
from dotenv import load_dotenv

# load .env explicitly from project root (backend folder)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    PROJECT_NAME = "EduSense"

    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "edusense_db")

    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    )

    # Cookies
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "False") == "True"

    # Email Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@edusense.app")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Reset Token
    RESET_TOKEN_EXPIRE_HOURS = int(os.getenv("RESET_TOKEN_EXPIRE_HOURS", 24))

    # External APIs
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")


settings = Settings()