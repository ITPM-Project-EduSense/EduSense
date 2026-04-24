import os
from pathlib import Path
from dotenv import load_dotenv


def _parse_csv_env(name: str) -> list[str]:
    raw_value = os.getenv(name, "")
    return [item.strip().rstrip("/") for item in raw_value.split(",") if item.strip()]

# Load .env from backend folder
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"SUCCESS: Loaded .env from {env_path}")
else:
    print(f"WARNING: .env file not found at {env_path}, checking current directory...")
    load_dotenv()  # Try loading from current working directory


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
    COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
    SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "session")
    SESSION_EXPIRE_DAYS = int(os.getenv("SESSION_EXPIRE_DAYS", 5))

    # Email Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@edusense.app")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    FRONTEND_URLS = _parse_csv_env("FRONTEND_URLS")

    # Reset Token
    RESET_TOKEN_EXPIRE_HOURS = int(os.getenv("RESET_TOKEN_EXPIRE_HOURS", 24))

    # External APIs
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY", "")


settings = Settings()
