from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True)
    short_code = Column(String(20), unique=True, nullable=False)
    original_url = Column(String(2048), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
