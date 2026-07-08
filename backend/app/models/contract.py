from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, unique=True, nullable=False)  # FK to orders.id
    contract_no = Column(String(50), nullable=False)
    party_a = Column(String(100), nullable=False)  # 甲方（广澜公司）
    party_b = Column(String(100), nullable=False)  # 乙方（承租方）
    space_name = Column(String(100), nullable=False)
    rent_type = Column(String(10), nullable=False)  # monthly/yearly
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    rent_amount = Column(Float, nullable=False)
    deposit = Column(String(50), nullable=True)  # 押金（面议文字）
    terms = Column(Text, nullable=True)  # 合同条款
    html_content = Column(Text, nullable=True)  # 生成的合同 HTML 内容
    file_path = Column(String(255), nullable=True)  # 生成 PDF 路径（保留兼容）
    created_at = Column(DateTime, server_default=func.now())
