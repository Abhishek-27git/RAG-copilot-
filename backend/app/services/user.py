import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin

class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """
        Retrieve a user by their UUID.
        """
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
        """
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, payload: UserRegister) -> User:
        """
        Create a new user with a hashed password.
        """
        hashed_pwd = get_password_hash(payload.password)
        user = User(
            email=payload.email,
            hashed_password=hashed_pwd,
            name=payload.name
        )
        db.add(user)
        await db.flush()  # Populates user.id without committing
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, payload: UserLogin) -> Optional[User]:
        """
        Verify user credentials. Returns the User model if valid, else None.
        """
        user = await UserService.get_by_email(db, payload.email)
        if not user:
            return None
        if not verify_password(payload.password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def update_password(db: AsyncSession, user: User, password: str) -> User:
        """
        Update a user's password.
        """
        user.hashed_password = get_password_hash(password)
        db.add(user)
        await db.flush()
        return user
