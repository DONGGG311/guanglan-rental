"""Spaces API routes: public list and detail endpoints for factory/workshop spaces."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.space import Space
from app.schemas.space import SpaceListResponse, SpaceResponse

router = APIRouter()


@router.get("/api/spaces", response_model=SpaceListResponse)
def list_spaces(
    keyword: str = Query("", description="Search keyword matching name or address"),
    area_category: str = Query("", description="Filter by area category: small, medium, large"),
    status: str = Query("available", description="Filter by status: available, rented, maintenance"),
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(12, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    """List published spaces with optional filtering, keyword search, and pagination."""
    query = db.query(Space).filter(Space.is_published == True)

    if area_category:
        query = query.filter(Space.area_category == area_category)

    if status:
        query = query.filter(Space.status == status)

    if keyword:
        query = query.filter(
            Space.name.contains(keyword) | Space.address.contains(keyword)
        )

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return SpaceListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/api/spaces/{space_id}", response_model=SpaceResponse)
def get_space(space_id: int, db: Session = Depends(get_db)):
    """Get a single published space by its ID."""
    space = (
        db.query(Space)
        .filter(Space.id == space_id, Space.is_published == True)
        .first()
    )
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")
    return space
