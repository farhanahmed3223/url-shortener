from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db, create_tables
from app.db.models import Link
from app.core.shortener import generate_short_code, validate_custom_slug

app = FastAPI(title="URL Shortener")
create_tables()

class ShortenRequest(BaseModel):
    url: str
    custom_slug: Optional[str] = None

@app.post("/shorten")
def shorten(req: ShortenRequest, db: Session = Depends(get_db)):
    if req.custom_slug:
        if not validate_custom_slug(req.custom_slug):
            raise HTTPException(status_code=422, detail="Invalid slug format")
        existing = db.query(Link).filter(Link.short_code == req.custom_slug).first()
        if existing:
            raise HTTPException(status_code=409, detail="Slug already taken")
        code = req.custom_slug
    else:
        code = generate_short_code()
    link = Link(short_code=code, original_url=req.url)
    db.add(link)
    db.commit()
    return {"short_code": code, "short_url": f"http://localhost:8000/r/{code}"}

@app.get("/r/{code}")
def redirect(code: str, db: Session = Depends(get_db)):
    link = db.query(Link).filter(Link.short_code == code).first()
    if not link:
        raise HTTPException(status_code=404)
    return RedirectResponse(url=link.original_url)

@app.get("/health")
def health():
    return {"status": "ok"}
