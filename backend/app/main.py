from fastapi import FastAPI, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db, create_tables
from app.db.models import Link
from app.core.shortener import generate_short_code

app = FastAPI(title="URL Shortener")
create_tables()

@app.post("/shorten")
def shorten(url: str, db: Session = Depends(get_db)):
    code = generate_short_code()
    link = Link(short_code=code, original_url=url)
    db.add(link)
    db.commit()
    return {"short_code": code, "url": f"http://localhost:8000/r/{code}"}

@app.get("/r/{code}")
def redirect(code: str, db: Session = Depends(get_db)):
    link = db.query(Link).filter(Link.short_code == code).first()
    if not link:
        return {"error": "not found"}
    return RedirectResponse(url=link.original_url)

@app.get("/health")
def health():
    return {"status": "ok"}
