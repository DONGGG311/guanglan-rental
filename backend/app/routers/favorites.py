"""Favorites API routes: toggle and list user favorites."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.favorite import Favorite
from app.models.space import Space
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class FavoriteToggleRequest(BaseModel):
    space_id: int


class FavoriteResponse(BaseModel):
    id: int
    space_id: int
    space_name: str
    area: float
    area_category: str
    monthly_rent: float
    yearly_rent: float
    address: str
    status: str
    images: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class FavoriteToggleResult(BaseModel):
    favorited: bool
    message: str


class FavoriteListResponse(BaseModel):
    items: list[FavoriteResponse]
    total: int


# ---------------------------------------------------------------------------
# POST /api/favorites — toggle favorite (add if not exists, remove if exists)
# ---------------------------------------------------------------------------


@router.post("/api/favorites", response_model=FavoriteToggleResult)
def toggle_favorite(
    data: FavoriteToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle a space as favorite for the current user.

    If already favorited, removes it. If not, adds it.
    """
    # Validate space exists
    space = db.query(Space).filter(Space.id == data.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.space_id == data.space_id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return FavoriteToggleResult(favorited=False, message="已取消收藏")

    fav = Favorite(user_id=current_user.id, space_id=data.space_id)
    db.add(fav)
    db.commit()
    return FavoriteToggleResult(favorited=True, message="已收藏")


# ---------------------------------------------------------------------------
# GET /api/favorites — list user's favorites with space info
# ---------------------------------------------------------------------------


@router.get("/api/favorites", response_model=FavoriteListResponse)
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all favorites for the current user, with space details."""
    favs = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    items = []
    for fav in favs:
        space = db.query(Space).filter(Space.id == fav.space_id).first()
        if space:
            items.append(
                FavoriteResponse(
                    id=fav.id,
                    space_id=fav.space_id,
                    space_name=space.name,
                    area=space.area,
                    area_category=space.area_category,
                    monthly_rent=space.monthly_rent,
                    yearly_rent=space.yearly_rent,
                    address=space.address,
                    status=space.status,
                    images=space.images,
                    created_at=fav.created_at.isoformat() if fav.created_at else None,
                )
            )

    return FavoriteListResponse(items=items, total=len(items))
