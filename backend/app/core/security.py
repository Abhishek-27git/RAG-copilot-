import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from app.core.config import settings

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hashed value using passlib.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using passlib.
    """
    return pwd_context.hash(password)



def create_jwt_token(data: dict, expires_delta: timedelta) -> str:
    """
    Generate a signed JWT token with custom claims and expiration time.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token. Returns payload dict or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
