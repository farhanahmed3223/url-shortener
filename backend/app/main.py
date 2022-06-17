from fastapi import FastAPI

app = FastAPI(title="URL Shortener")

@app.get("/")
def root():
    return {"message": "hello world"}

@app.get("/health")
def health():
    return {"status": "ok"}
