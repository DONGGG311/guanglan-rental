"""Orders API routes: create, list, detail, and renew orders."""

from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.models.space import Space
from app.routers.notifications import create_notification
from app.schemas.order import OrderCreate, OrderListResponse, OrderResponse
from app.services.auth import decode_token
from app.utils.order_no import generate_order_no

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/orders — create a new order
# ---------------------------------------------------------------------------


@router.post("/api/orders", response_model=OrderResponse)
def create_order(
    data: OrderCreate,
    authorization: str = Header(""),
    db: Session = Depends(get_db),
):
    """Submit an order.

    Supports two modes:
    1. Authenticated user — provide Authorization: Bearer <token> header.
    2. Quick order — no auth required; contact_phone is used for lookups.
    """
    # --- Resolve user_id from token if provided ---
    user_id = None
    if authorization:
        payload = decode_token(_extract_token(authorization))
        if payload and "user_id" in payload:
            user_id = payload["user_id"]

    # --- Validate space ---
    space = db.query(Space).filter(Space.id == data.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    # --- Calculate total amount ---
    if data.rent_type == "monthly":
        total_amount = space.monthly_rent * data.duration
    elif data.rent_type == "yearly":
        total_amount = space.yearly_rent * data.duration
    else:
        raise HTTPException(status_code=400, detail="无效的租用类型，仅支持 monthly 或 yearly")

    # --- Generate unique order number ---
    order_no = generate_order_no(db)

    # --- Create order ---
    order = Order(
        order_no=order_no,
        user_id=user_id,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        contact_email=data.contact_email,
        space_id=data.space_id,
        rent_type=data.rent_type,
        start_date=data.start_date,
        duration=data.duration,
        total_amount=total_amount,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Create notification for authenticated users
    if user_id:
        create_notification(
            db,
            user_id=user_id,
            title="订单已提交",
            content=f"您的订单 {order_no}（{space.name}）已成功提交，请等待审核。",
            notif_type="order_update",
        )

    # --- Build response with space name ---
    resp = OrderResponse.model_validate(order)
    resp.space_name = space.name
    return resp


# ---------------------------------------------------------------------------
# GET /api/orders — list orders
# ---------------------------------------------------------------------------


@router.get("/api/orders", response_model=OrderListResponse)
def list_orders(
    phone: str = Query("", description="Filter by contact phone (for quick orders)"),
    authorization: str = Header(""),
    db: Session = Depends(get_db),
):
    """List orders for the current user OR by phone query parameter.

    - Authenticated user: returns orders belonging to that user.
    - Phone query param: returns orders matching the phone number (quick orders).
    - If both are provided, phone takes precedence.
    - If neither is provided, returns a 400 error.
    """
    query = db.query(Order)

    if phone:
        query = query.filter(Order.contact_phone == phone)
    elif authorization:
        payload = decode_token(_extract_token(authorization))
        if payload and "user_id" in payload:
            query = query.filter(Order.user_id == payload["user_id"])
        else:
            raise HTTPException(status_code=401, detail="无效的认证令牌")
    else:
        raise HTTPException(
            status_code=400,
            detail="请提供用户认证或手机号查询参数",
        )

    orders = query.order_by(Order.created_at.desc()).all()

    # Enrich with space names
    items = []
    for order in orders:
        item = OrderResponse.model_validate(order)
        space = db.query(Space).filter(Space.id == order.space_id).first()
        item.space_name = space.name if space else None
        items.append(item)

    return OrderListResponse(items=items, total=len(items))


# ---------------------------------------------------------------------------
# GET /api/orders/{order_id} — order detail
# ---------------------------------------------------------------------------


@router.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single order by its ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    resp = OrderResponse.model_validate(order)
    space = db.query(Space).filter(Space.id == order.space_id).first()
    resp.space_name = space.name if space else None
    return resp


# ---------------------------------------------------------------------------
# POST /api/orders/{order_id}/renew — create a renewal order
# ---------------------------------------------------------------------------


@router.post("/api/orders/{order_id}/renew", response_model=OrderResponse)
def renew_order(order_id: int, db: Session = Depends(get_db)):
    """Create a renewal order based on an existing order.

    Copies contact info, space, rent_type, and duration from the original.
    Generates a new order number and sets start_date to now.
    """
    original = db.query(Order).filter(Order.id == order_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="原订单不存在")

    space = db.query(Space).filter(Space.id == original.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="关联厂房不存在")

    # Calculate amount using current space rent
    if original.rent_type == "monthly":
        total_amount = space.monthly_rent * original.duration
    else:
        total_amount = space.yearly_rent * original.duration

    # Generate new order number
    order_no = generate_order_no(db)

    new_order = Order(
        order_no=order_no,
        user_id=original.user_id,
        contact_name=original.contact_name,
        contact_phone=original.contact_phone,
        contact_email=original.contact_email,
        space_id=original.space_id,
        rent_type=original.rent_type,
        start_date=datetime.utcnow(),
        duration=original.duration,
        total_amount=total_amount,
        status="pending",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Create notification for authenticated users
    if new_order.user_id:
        create_notification(
            db,
            user_id=new_order.user_id,
            title="续租订单已提交",
            content=f"您的续租订单 {order_no}（{space.name}）已成功提交，请等待审核。",
            notif_type="order_update",
        )

    resp = OrderResponse.model_validate(new_order)
    resp.space_name = space.name
    return resp


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_token(authorization: str) -> str:
    """Extract JWT token from 'Bearer <token>' header string."""
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer "):]
    return authorization
