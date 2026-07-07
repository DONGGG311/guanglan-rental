"""Authentication routes: user registration, user login, admin login, and auth dependencies."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Admin, User
from app.schemas.user import AdminLogin, Token, UserLogin, UserRegister
from app.services.auth import (
    create_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# User registration
# ---------------------------------------------------------------------------

@router.post("/api/auth/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account. Returns a JWT access token."""
    # Check for duplicate phone
    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=409, detail="手机号已被注册")

    user = User(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=hash_password(data.password),
        company=data.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"user_id": user.id})
    return Token(access_token=token)


# ---------------------------------------------------------------------------
# User login
# ---------------------------------------------------------------------------

@router.post("/api/auth/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with phone + password. Returns a JWT access token."""
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="手机号或密码错误")

    token = create_token({"user_id": user.id})
    return Token(access_token=token)


# ---------------------------------------------------------------------------
# Admin login
# ---------------------------------------------------------------------------

@router.post("/admin/auth/login", response_model=Token)
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    """Admin login with username + password. Returns a JWT access token."""
    admin = db.query(Admin).filter(Admin.username == data.username).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token({"admin_id": admin.id})
    return Token(access_token=token)


# ---------------------------------------------------------------------------
# Auth dependencies (injectable via Depends)
# ---------------------------------------------------------------------------


def get_current_user(
    authorization: str = Header(...), db: Session = Depends(get_db)
) -> User:
    """Dependency: extract and validate the JWT bearer token for a user.

    Usage:
        @router.get("/protected")
        def my_route(current_user: User = Depends(get_current_user)):
            ...
    """
    token = _extract_bearer_token(authorization)
    payload = decode_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="无效的认证令牌")

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def get_current_admin(
    authorization: str = Header(...), db: Session = Depends(get_db)
) -> Admin:
    """Dependency: extract and validate the JWT bearer token for an admin.

    Usage:
        @router.get("/admin/protected")
        def my_route(current_admin: Admin = Depends(get_current_admin)):
            ...
    """
    token = _extract_bearer_token(authorization)
    payload = decode_token(token)
    if not payload or "admin_id" not in payload:
        raise HTTPException(status_code=401, detail="无效的管理员令牌")

    admin = db.query(Admin).filter(Admin.id == payload["admin_id"]).first()
    if not admin:
        raise HTTPException(status_code=401, detail="管理员不存在")
    return admin


# ---------------------------------------------------------------------------
# Auth dependency test endpoints (verify get_current_user / get_current_admin)
# ---------------------------------------------------------------------------


@router.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    """Test endpoint: returns the current authenticated user's info."""
    return {"id": current_user.id, "name": current_user.name, "phone": current_user.phone}


@router.get("/admin/auth/me")
def admin_me(current_admin: Admin = Depends(get_current_admin)):
    """Test endpoint: returns the current authenticated admin's info."""
    return {"id": current_admin.id, "username": current_admin.username, "email": current_admin.email}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_bearer_token(authorization: str) -> str:
    """Extract the token from an Authorization: Bearer <token> header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="认证格式错误")
    return authorization[len("Bearer "):]
