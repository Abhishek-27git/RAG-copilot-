import uuid
from datetime import timedelta
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_jwt_token,
    decode_jwt_token,
)
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str
) -> None:
    """
    Sets httpOnly JWT cookies in response headers.
    """
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/auth/refresh",
    )

def clear_auth_cookies(response: Response) -> None:
    """
    Clears access and refresh tokens.
    Note: Deletion path must match the creation path.
    """
    response.delete_cookie(key="access_token", path="/", secure=settings.COOKIE_SECURE, samesite=settings.COOKIE_SAMESITE)
    response.delete_cookie(key="refresh_token", path="/auth/refresh", secure=settings.COOKIE_SECURE, samesite=settings.COOKIE_SAMESITE)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency to retrieve the current user from session access cookie.
    Raises 401 on missing, expired, or invalid tokens.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Access token missing",
        )

    payload = decode_jwt_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid or expired access token",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Missing subject claim",
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid token claims",
        )

    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: User account not found",
        )
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Check if email is already registered
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    # Hash password and create user
    hashed_pwd = get_password_hash(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        name=payload.name
    )
    db.add(user)
    await db.flush() # populates user.id without committing transaction

    # Issue access/refresh tokens
    user_id_str = str(user.id)
    access_token = create_jwt_token(
        data={"sub": user_id_str, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_jwt_token(
        data={"sub": user_id_str, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post("/login", response_model=UserOut)
async def login(
    payload: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Retrieve user by email
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate tokens
    user_id_str = str(user.id)
    access_token = create_jwt_token(
        data={"sub": user_id_str, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_jwt_token(
        data={"sub": user_id_str, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post("/refresh", response_model=MessageResponse)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    payload = decode_jwt_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Verify user still exists
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )

    stmt = select(User).where(User.id == user_uuid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Generate new access token
    access_token = create_jwt_token(
        data={"sub": user_id_str, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # Re-issue refresh token to extend sliding session
    refresh_token = create_jwt_token(
        data={"sub": user_id_str, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    set_auth_cookies(response, access_token, refresh_token)
    return {"message": "Token refreshed successfully"}


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
