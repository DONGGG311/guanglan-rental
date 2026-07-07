from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # FK to users.id
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    type = Column(String(20), default="system")  # order_update/system/other
    created_at = Column(DateTime, server_default=func.now())
