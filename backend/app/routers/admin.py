"""Admin-only routes: contract generation, dashboard, spaces CRUD, orders management."""

import json
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import Contract
from app.models.notification import Notification
from app.models.order import Order
from app.models.space import Space
from app.models.user import Admin, User
from app.routers.auth import get_current_admin, get_current_user
from app.routers.notifications import create_notification
from app.schemas.contract import ContractCreate, ContractResponse
from app.services.contract import generate_contract_html
from app.services.email import notify_user_order_status
from app.utils.contract_no import generate_contract_no

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


# ---------------------------------------------------------------------------
# POST /admin/orders/{order_id}/contract — generate contract (admin only)
# ---------------------------------------------------------------------------

PARTY_A = "广澜印刷包装有限公司"


@router.post(
    "/admin/orders/{order_id}/contract",
    response_model=ContractResponse,
    status_code=201,
)
def generate_contract(
    order_id: int,
    data: ContractCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin generates a contract for an order.

    Auto-fills party_a, space_name, and rent info from the order.
    """
    # --- Validate order exists ---
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # --- Check if contract already exists for this order ---
    existing = db.query(Contract).filter(Contract.order_id == order_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="该订单已生成合同，如需修改请先使用管理功能")

    # --- Validate space ---
    space = db.query(Space).filter(Space.id == order.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="关联厂房不存在")

    # --- Generate contract number ---
    contract_no = generate_contract_no(db)

    # --- Determine rent amount based on rent type ---
    if order.rent_type == "monthly":
        rent_amount = space.monthly_rent
    else:
        rent_amount = space.yearly_rent

    # --- Format dates for template ---
    start_date_str = data.start_date.strftime("%Y年%m月%d日")
    end_date_str = data.end_date.strftime("%Y年%m月%d日")

    # --- Generate HTML contract ---
    html_content = generate_contract_html(
        contract_no=contract_no,
        party_a=PARTY_A,
        party_b=data.party_b,
        space_name=space.name,
        rent_type=order.rent_type,
        rent_amount=rent_amount,
        start_date=start_date_str,
        end_date=end_date_str,
        deposit=data.deposit,
        terms=data.terms,
    )

    # --- Create contract record ---
    contract = Contract(
        order_id=order_id,
        contract_no=contract_no,
        party_a=PARTY_A,
        party_b=data.party_b,
        space_name=space.name,
        rent_type=order.rent_type,
        start_date=data.start_date,
        end_date=data.end_date,
        rent_amount=rent_amount,
        deposit=data.deposit,
        terms=data.terms,
        html_content=html_content,
    )
    db.add(contract)

    # --- Update order status to "signed" ---
    order.status = "signed"
    order.admin_remark = (order.admin_remark or "") + f"\n合同已生成：{contract_no}"

    db.commit()
    db.refresh(contract)

    # --- Notify user ---
    if order.user_id:
        create_notification(
            db,
            user_id=order.user_id,
            title="合同已生成",
            content=f"您的订单 {order.order_no}（{space.name}）的租赁合同已生成，合同编号：{contract_no}。请登录查看。",
            notif_type="order_update",
        )

    return ContractResponse.model_validate(contract)


# ---------------------------------------------------------------------------
# GET /admin/orders/{order_id}/contract — view contract HTML (admin only)
# ---------------------------------------------------------------------------


@router.get(
    "/admin/orders/{order_id}/contract",
    response_class=HTMLResponse,
)
def view_contract_admin(
    order_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin views the generated contract HTML for an order."""
    contract = db.query(Contract).filter(Contract.order_id == order_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="该订单尚未生成合同")
    if not contract.html_content:
        raise HTTPException(status_code=404, detail="合同内容为空")

    return HTMLResponse(content=contract.html_content)


# ---------------------------------------------------------------------------
# GET /api/orders/{order_id}/contract — user views their contract
# ---------------------------------------------------------------------------


@router.get(
    "/api/orders/{order_id}/contract",
    response_class=HTMLResponse,
)
def view_contract_user(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User views their own contract. Verifies the order belongs to the user."""
    # Verify order exists and belongs to this user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在或不属于当前用户")

    contract = db.query(Contract).filter(Contract.order_id == order_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="该订单尚未生成合同")
    if not contract.html_content:
        raise HTTPException(status_code=404, detail="合同内容为空")

    return HTMLResponse(content=contract.html_content)


# ---------------------------------------------------------------------------
# GET /api/orders/{order_id}/contract/info — user gets contract metadata
# ---------------------------------------------------------------------------


@router.get(
    "/api/orders/{order_id}/contract/info",
    response_model=ContractResponse,
)
def get_contract_info_user(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User gets contract metadata (without full HTML) for their order."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在或不属于当前用户")

    contract = db.query(Contract).filter(Contract.order_id == order_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="该订单尚未生成合同")

    return ContractResponse.model_validate(contract)


# ---------------------------------------------------------------------------
# GET /admin/orders/{order_id}/contract/info — admin gets contract metadata
# ---------------------------------------------------------------------------


@router.get(
    "/admin/orders/{order_id}/contract/info",
    response_model=ContractResponse,
)
def get_contract_info_admin(
    order_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin gets contract metadata (without full HTML) for an order."""
    contract = db.query(Contract).filter(Contract.order_id == order_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="该订单尚未生成合同")

    return ContractResponse.model_validate(contract)


# ---------------------------------------------------------------------------
# Dashboard schemas
# ---------------------------------------------------------------------------


class DashboardStats(BaseModel):
    total_spaces: int
    available_spaces: int
    rented_spaces: int
    pending_orders: int
    total_orders: int
    vacancy_rate: float


# ---------------------------------------------------------------------------
# GET /admin/dashboard — dashboard statistics
# ---------------------------------------------------------------------------


@router.get("/admin/dashboard", response_model=DashboardStats)
def dashboard_stats(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Return aggregate statistics for the admin dashboard."""
    total_spaces = db.query(Space).count()
    available_spaces = db.query(Space).filter(Space.status == "available").count()
    rented_spaces = db.query(Space).filter(Space.status == "rented").count()
    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    total_orders = db.query(Order).count()
    vacancy_rate = round((available_spaces / total_spaces * 100) if total_spaces > 0 else 0, 1)

    return DashboardStats(
        total_spaces=total_spaces,
        available_spaces=available_spaces,
        rented_spaces=rented_spaces,
        pending_orders=pending_orders,
        total_orders=total_orders,
        vacancy_rate=vacancy_rate,
    )


# ---------------------------------------------------------------------------
# Space Create/Update schemas
# ---------------------------------------------------------------------------


class SpaceCreate(BaseModel):
    name: str
    area: float
    area_category: str = "small"
    monthly_rent: float
    yearly_rent: float
    address: Optional[str] = None
    description: Optional[str] = None
    floor_height: Optional[float] = None
    ground_load: Optional[float] = None
    power_capacity: Optional[int] = None
    has_crane: bool = False
    has_forklift: bool = False
    floor_material: Optional[str] = None
    fire_rating: Optional[str] = None
    drainage: Optional[str] = None
    ventilation: Optional[str] = None
    has_office: bool = False
    parking: Optional[str] = None
    loading_platform: bool = False
    status: str = "available"
    is_published: bool = False


class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = None
    area_category: Optional[str] = None
    monthly_rent: Optional[float] = None
    yearly_rent: Optional[float] = None
    address: Optional[str] = None
    description: Optional[str] = None
    floor_height: Optional[float] = None
    ground_load: Optional[float] = None
    power_capacity: Optional[int] = None
    has_crane: Optional[bool] = None
    has_forklift: Optional[bool] = None
    floor_material: Optional[str] = None
    fire_rating: Optional[str] = None
    drainage: Optional[str] = None
    ventilation: Optional[str] = None
    has_office: Optional[bool] = None
    parking: Optional[str] = None
    loading_platform: Optional[bool] = None
    status: Optional[str] = None
    is_published: Optional[bool] = None


# ---------------------------------------------------------------------------
# GET /admin/spaces — list all spaces (admin, includes unpublished)
# ---------------------------------------------------------------------------


@router.get("/admin/spaces")
def admin_list_spaces(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List all spaces for admin management, including unpublished ones."""
    query = db.query(Space)
    total = query.count()
    spaces = (
        query.order_by(Space.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_space_to_dict(s) for s in spaces],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# POST /admin/spaces — create a new space
# ---------------------------------------------------------------------------


@router.post("/admin/spaces", status_code=201)
def create_space(
    data: SpaceCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new factory/workshop space."""
    space = Space(**data.model_dump())
    db.add(space)
    db.commit()
    db.refresh(space)
    return _space_to_dict(space)


# ---------------------------------------------------------------------------
# PUT /admin/spaces/{id} — update a space
# ---------------------------------------------------------------------------


@router.put("/admin/spaces/{space_id}")
def update_space(
    space_id: int,
    data: SpaceUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing space. Only non-None fields are updated."""
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(space, key, value)

    db.commit()
    db.refresh(space)
    return _space_to_dict(space)


# ---------------------------------------------------------------------------
# DELETE /admin/spaces/{id} — delete a space
# ---------------------------------------------------------------------------


@router.delete("/admin/spaces/{space_id}")
def delete_space(
    space_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a space permanently."""
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    db.delete(space)
    db.commit()
    return {"message": "厂房已删除"}


# ---------------------------------------------------------------------------
# PUT /admin/spaces/{id}/publish — toggle is_published
# ---------------------------------------------------------------------------


@router.put("/admin/spaces/{space_id}/publish")
def toggle_publish(
    space_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Toggle the published status of a space."""
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    space.is_published = not space.is_published
    db.commit()
    db.refresh(space)
    return _space_to_dict(space)


# ---------------------------------------------------------------------------
# POST /admin/spaces/{id}/images — upload images
# ---------------------------------------------------------------------------


@router.post("/admin/spaces/{space_id}/images")
async def upload_space_images(
    space_id: int,
    files: list[UploadFile] = File(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Upload one or more image files for a space.

    Files are saved to the uploads/ directory and the space's images JSON
    array is updated.
    """
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    # Ensure uploads directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Parse existing images
    try:
        images = json.loads(space.images) if space.images else []
    except (json.JSONDecodeError, TypeError):
        images = []

    saved_paths = []
    for file in files:
        # Generate unique filename
        ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_name

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        saved_paths.append(f"/uploads/{unique_name}")

    images.extend(saved_paths)
    space.images = json.dumps(images)
    db.commit()
    db.refresh(space)

    return {"images": images, "uploaded": saved_paths}


# ---------------------------------------------------------------------------
# DELETE /admin/spaces/{id}/images — remove an image
# ---------------------------------------------------------------------------


class RemoveImagePayload(BaseModel):
    image_url: str


@router.delete("/admin/spaces/{space_id}/images")
def remove_space_image(
    space_id: int,
    payload: RemoveImagePayload,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a specific image URL from a space's images list."""
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="厂房不存在")

    try:
        images = json.loads(space.images) if space.images else []
    except (json.JSONDecodeError, TypeError):
        images = []

    if payload.image_url in images:
        images.remove(payload.image_url)
        # Try to delete the physical file
        filename = payload.image_url.split("/")[-1]
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            os.remove(file_path)

    space.images = json.dumps(images)
    db.commit()
    db.refresh(space)

    return {"images": images}


# ---------------------------------------------------------------------------
# GET /admin/orders — list all orders (admin)
# ---------------------------------------------------------------------------


@router.get("/admin/orders")
def admin_list_orders(
    status: str = Query("", description="Filter by order status"),
    keyword: str = Query("", description="Search by order_no, contact_name, or contact_phone"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List all orders with optional filtering for admin management."""
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    if keyword:
        query = query.filter(
            Order.order_no.contains(keyword)
            | Order.contact_name.contains(keyword)
            | Order.contact_phone.contains(keyword)
        )

    total = query.count()
    orders = (
        query.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for order in orders:
        item = _order_to_dict(order)
        space = db.query(Space).filter(Space.id == order.space_id).first()
        item["space_name"] = space.name if space else None
        items.append(item)

    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ---------------------------------------------------------------------------
# GET /admin/orders/{id} — order detail (admin)
# ---------------------------------------------------------------------------


@router.get("/admin/orders/{order_id}")
def admin_get_order(
    order_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get a single order detail for admin."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    item = _order_to_dict(order)
    space = db.query(Space).filter(Space.id == order.space_id).first()
    item["space_name"] = space.name if space else None
    return item


# ---------------------------------------------------------------------------
# PUT /admin/orders/{id}/status — update order status
# ---------------------------------------------------------------------------


class StatusUpdatePayload(BaseModel):
    status: str


VALID_ORDER_STATUSES = {
    "pending", "reviewing", "approved", "rejected",
    "signed", "active", "completed", "cancelled",
}

STATUS_NOTIFICATION_MAP = {
    "reviewing": ("订单审核中", "您的订单 {order_no}（{space_name}）正在审核中。"),
    "approved": ("订单已通过", "您的订单 {order_no}（{space_name}）已通过审核，后续会生成合同。"),
    "rejected": ("订单已拒绝", "您的订单 {order_no}（{space_name}）未通过审核，如有疑问请联系管理员。"),
    "signed": ("合同已签署", "您的订单 {order_no}（{space_name}）已完成合同签署。"),
    "active": ("租赁已开始", "您的订单 {order_no}（{space_name}）租赁已正式开始。"),
    "completed": ("租赁已完成", "您的订单 {order_no}（{space_name}）租赁期已结束。"),
    "cancelled": ("订单已取消", "您的订单 {order_no}（{space_name}）已被取消。"),
}


@router.put("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: StatusUpdatePayload,
    background_tasks: BackgroundTasks,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update the status of an order. Creates a notification for the user on status change."""
    if payload.status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"无效的状态值，有效值: {', '.join(sorted(VALID_ORDER_STATUSES))}",
        )

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    order.status = payload.status

    # Update space status when order becomes active or completed
    if payload.status == "active":
        space = db.query(Space).filter(Space.id == order.space_id).first()
        if space:
            space.status = "rented"
    elif payload.status in ("completed", "cancelled"):
        space = db.query(Space).filter(Space.id == order.space_id).first()
        if space:
            space.status = "available"

    db.commit()
    db.refresh(order)

    # Send notification to user if user_id exists
    if order.user_id and payload.status in STATUS_NOTIFICATION_MAP:
        space = db.query(Space).filter(Space.id == order.space_id).first()
        space_name = space.name if space else "未知厂房"
        title_template, content_template = STATUS_NOTIFICATION_MAP[payload.status]
        create_notification(
            db,
            user_id=order.user_id,
            title=title_template,
            content=content_template.format(order_no=order.order_no, space_name=space_name),
            notif_type="order_update",
        )

        # --- Send status-change email to user (background task) ---
        user = db.query(User).filter(User.id == order.user_id).first()
        if user and user.email:
            background_tasks.add_task(
                notify_user_order_status,
                user.email,
                order.order_no,
                space_name,
                payload.status,
            )

    return {"message": f"订单状态已更新为 {payload.status}", "status": payload.status}


# ---------------------------------------------------------------------------
# POST /admin/notifications — send manual notification
# ---------------------------------------------------------------------------


class SendNotificationPayload(BaseModel):
    user_id: int
    title: str
    content: str = ""
    notif_type: str = "system"


@router.post("/admin/notifications", status_code=201)
def send_notification(
    payload: SendNotificationPayload,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin manually sends a notification to a specific user."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    notification = create_notification(
        db,
        user_id=payload.user_id,
        title=payload.title,
        content=payload.content,
        notif_type=payload.notif_type,
    )

    return {
        "message": "通知已发送",
        "notification": {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        },
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _space_to_dict(space: Space) -> dict:
    """Convert a Space model instance to a JSON-serializable dict."""
    return {
        "id": space.id,
        "name": space.name,
        "area": space.area,
        "area_category": space.area_category,
        "monthly_rent": space.monthly_rent,
        "yearly_rent": space.yearly_rent,
        "address": space.address,
        "description": space.description,
        "floor_height": space.floor_height,
        "ground_load": space.ground_load,
        "power_capacity": space.power_capacity,
        "has_crane": space.has_crane,
        "has_forklift": space.has_forklift,
        "floor_material": space.floor_material,
        "fire_rating": space.fire_rating,
        "drainage": space.drainage,
        "ventilation": space.ventilation,
        "has_office": space.has_office,
        "parking": space.parking,
        "loading_platform": space.loading_platform,
        "images": space.images,
        "status": space.status,
        "is_published": space.is_published,
        "created_at": space.created_at.isoformat() if space.created_at else None,
        "updated_at": space.updated_at.isoformat() if space.updated_at else None,
    }


def _order_to_dict(order: Order) -> dict:
    """Convert an Order model instance to a JSON-serializable dict."""
    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "contact_name": order.contact_name,
        "contact_phone": order.contact_phone,
        "contact_email": order.contact_email,
        "space_id": order.space_id,
        "rent_type": order.rent_type,
        "start_date": order.start_date.isoformat() if order.start_date else None,
        "duration": order.duration,
        "total_amount": order.total_amount,
        "status": order.status,
        "admin_remark": order.admin_remark,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }
