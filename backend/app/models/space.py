from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    area = Column(Float, nullable=False)
    area_category = Column(String(10), nullable=False, default="small")  # small/medium/large
    monthly_rent = Column(Float, nullable=False)
    yearly_rent = Column(Float, nullable=False)
    address = Column(String(255))
    description = Column(Text)
    floor_height = Column(Float)
    ground_load = Column(Float)
    power_capacity = Column(Integer)
    has_crane = Column(Boolean, default=False)
    has_forklift = Column(Boolean, default=False)
    floor_material = Column(String(50))
    fire_rating = Column(String(50))
    drainage = Column(String(100))
    ventilation = Column(String(100))
    has_office = Column(Boolean, default=False)
    parking = Column(String(100))
    loading_platform = Column(Boolean, default=False)
    images = Column(Text, default="[]")  # JSON array of file paths
    status = Column(String(20), default="available")  # available/rented/maintenance
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
