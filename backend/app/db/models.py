from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Integer, func
from sqlalchemy.orm import relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    links = relationship("Link", back_populates="owner", cascade="all, delete-orphan")

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, autoincrement=True)
    short_code = Column(String(20), unique=True, nullable=False, index=True)
    original_url = Column(String(2048), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    custom_slug = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    owner = relationship("User", back_populates="links")
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")

class Click(Base):
    __tablename__ = "clicks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False, index=True)
    clicked_at = Column(Date, nullable=False)
    country = Column(String(2), default="XX")
    link = relationship("Link", back_populates="clicks")
