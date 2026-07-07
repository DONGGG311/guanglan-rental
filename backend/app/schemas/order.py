"""Pydantic schemas for order creation and response."""

from datetime import datetime

from pydantic import BaseModel


class OrderCreate(BaseModel):
    """Payload for creating a new order."""

    contact_name: str
    contact_phone: str
    contact_email: str | None = None
    space_id: int
    rent_type: str  # monthly / yearly
    start_date: datetime
    duration: int  # number of months (monthly) or years (yearly)


class OrderResponse(BaseModel):
    """Full order detail returned to clients."""

    id: int
    order_no: str
    user_id: int | None = None
    contact_name: str
    contact_phone: str
    contact_email: str | None = None
    space_id: int
    space_name: str | None = None  # populated from Space model
    rent_type: str
    start_date: datetime
    duration: int
    total_amount: float
    status: str
    admin_remark: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Paginated list wrapper for orders."""

    items: list[OrderResponse]
    total: int
