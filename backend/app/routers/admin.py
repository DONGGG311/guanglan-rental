"""Admin-only routes: contract generation and management."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import Contract
from app.models.order import Order
from app.models.space import Space
from app.models.user import Admin, User
from app.routers.auth import get_current_admin, get_current_user
from app.routers.notifications import create_notification
from app.schemas.contract import ContractCreate, ContractResponse
from app.services.contract import generate_contract_html
from app.utils.contract_no import generate_contract_no

router = APIRouter()


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
