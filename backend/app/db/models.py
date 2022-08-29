from sqlalchemy import Column, String, Boolean, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, autoincrement=True)
    short_code = Column(String(20), unique=True, nullable=False, index=True)
    original_url = Column(String(2048), nullable=False)
    custom_slug = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
