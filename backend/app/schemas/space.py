"""Pydantic schemas for space (factory/workshop) responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SpaceResponse(BaseModel):
    """Full space detail, returned for both single and list endpoints."""

    id: int
    name: str
    area: float
    area_category: str
    monthly_rent: float
    yearly_rent: float
    address: Optional[str] = None
    description: Optional[str] = None
    floor_height: Optional[float] = None
    ground_load: Optional[float] = None
    power_capacity: Optional[int] = None
    has_crane: Optional[bool] = False
    has_forklift: Optional[bool] = False
    floor_material: Optional[str] = None
    fire_rating: Optional[str] = None
    drainage: Optional[str] = None
    ventilation: Optional[str] = None
    has_office: Optional[bool] = False
    parking: Optional[str] = None
    loading_platform: Optional[bool] = False
    images: Optional[str] = "[]"
    status: str
    is_published: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SpaceListResponse(BaseModel):
    """Paginated list wrapper for spaces."""

    items: list[SpaceResponse]
    total: int
    page: int
    page_size: int
