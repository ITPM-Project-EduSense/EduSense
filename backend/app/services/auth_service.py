from fastapi import HTTPException
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token


def _public_user(user_doc: dict) -> dict:
    """Convert Mongo user doc to public safe format."""
    return {
        "id": str(user_doc["_id"]),
        "full_name": user_doc["full_name"],
        "email": user_doc["email"],
    }


class AuthService:
    """
    Auth business logic (register, login).
    """

    @staticmethod
    async def register(full_name: str, email: str, password: str) -> dict:
        db = get_db()
        users = db["users"]

        email_lower = email.lower().strip()
        existing = await users.find_one({"email": email_lower})

        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_doc = {
            "full_name": full_name.strip(),
            "email": email_lower,
            "password_hash": hash_password(password),
        }

        result = await users.insert_one(user_doc)
        created = await users.find_one({"_id": result.inserted_id})

        return {"message": "Registered successfully", "user": _public_user(created)}

    @staticmethod
    async def login(email: str, password: str) -> dict:
        db = get_db()
        users = db["users"]

        email_lower = email.lower().strip()
        user = await users.find_one({"email": email_lower})

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"user_id": str(user["_id"]), "email": user["email"]})

        return {"message": "Login success", "token": token, "user": _public_user(user)}