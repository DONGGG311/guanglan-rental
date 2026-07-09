"""Authentication service: password hashing and JWT token management."""

from datetime import datetime, timedelta

from jose import JWTError, jwt
import bcrypt


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


SECRET_KEY = "guanglan-secret-key-change-in-production"
ALGORITHM = "HS256"
DEFAULT_EXPIRY = timedelta(hours=24)


def create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT token with the given payload and expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or DEFAULT_EXPIRY)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload dict or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
