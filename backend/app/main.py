from fastapi import FastAPI
from fastapi.responses import RedirectResponse

app = FastAPI(title="URL Shortener")
_links = {}

@app.get("/")
def root():
    return {"message": "url shortener"}

@app.post("/shorten")
def shorten(url: str):
    import random, string
    code = "".join(random.choices(string.ascii_lowercase, k=6))
    _links[code] = url
    return {"short": f"http://localhost:8000/r/{code}"}

@app.get("/r/{code}")
def redirect(code: str):
    url = _links.get(code)
    if not url:
        return {"error": "not found"}
    return RedirectResponse(url=url)

@app.get("/health")
def health():
    return {"status": "ok"}
