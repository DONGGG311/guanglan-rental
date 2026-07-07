from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(30), unique=True, nullable=False)
    user_id = Column(Integer, nullable=True)  # nullable for quick order
    contact_name = Column(String(50), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(100))
    space_id = Column(Integer, nullable=False)
    rent_type = Column(String(10), nullable=False)  # monthly/yearly
    start_date = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    admin_remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
