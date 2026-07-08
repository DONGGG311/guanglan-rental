"""Pydantic schemas for contract creation and response."""

from datetime import datetime

from pydantic import BaseModel


class ContractCreate(BaseModel):
    """Payload for generating a new contract (admin only)."""

    party_b: str  # 乙方（承租方）名称
    start_date: datetime
    end_date: datetime
    deposit: str | None = None  # 押金（面议文字）
    terms: str | None = None  # 合同条款


class ContractResponse(BaseModel):
    """Full contract detail returned to clients."""

    id: int
    order_id: int
    contract_no: str
    party_a: str
    party_b: str
    space_name: str
    rent_type: str
    start_date: datetime
    end_date: datetime
    rent_amount: float
    deposit: str | None = None
    terms: str | None = None
    html_content: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
