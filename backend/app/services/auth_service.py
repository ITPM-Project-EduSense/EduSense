from fastapi import HTTPException
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:

    @staticmethod
    async def register(full_name: str, email: str, password: str):
        email_lower = email.lower().strip()

        existing = await User.find_one(User.email == email_lower)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = User(
            full_name=full_name.strip(),
            email=email_lower,
            password_hash=hash_password(password),
        )

        await user.insert()

        return {
            "message": "Registered successfully",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
            }
        }

    @staticmethod
    async def login(email: str, password: str):
        email_lower = email.lower().strip()

        user = await User.find_one(User.email == email_lower)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({
            "user_id": str(user.id),
            "email": user.email
        })

        return {
            "message": "Login success",
            "token": token,
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
            }
        }