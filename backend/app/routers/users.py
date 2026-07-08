"""User profile API routes: get and update profile."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class ProfileResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None = None
    company: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    company: str | None = None


# ---------------------------------------------------------------------------
# GET /api/user/profile — get current user profile
# ---------------------------------------------------------------------------


@router.get("/api/user/profile", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    """Return the current authenticated user's profile."""
    return ProfileResponse(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        company=current_user.company,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
    )


# ---------------------------------------------------------------------------
# PUT /api/user/profile — update user profile
# ---------------------------------------------------------------------------


@router.put("/api/user/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's name, email, and/or company."""
    if data.name is not None:
        if not data.name.strip():
            raise HTTPException(status_code=400, detail="姓名不能为空")
        current_user.name = data.name.strip()

    if data.email is not None:
        # Check email uniqueness (excluding current user)
        if data.email.strip():
            existing = (
                db.query(User)
                .filter(User.email == data.email.strip(), User.id != current_user.id)
                .first()
            )
            if existing:
                raise HTTPException(status_code=409, detail="邮箱已被使用")
        current_user.email = data.email.strip() if data.email.strip() else None

    if data.company is not None:
        current_user.company = data.company.strip() if data.company.strip() else None

    db.commit()
    db.refresh(current_user)

    return ProfileResponse(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        company=current_user.company,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
    )
