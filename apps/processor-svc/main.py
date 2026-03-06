from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import parse, export

app = FastAPI(
    title="FinConvert AI — Processor Service",
    description="PDF bank statement parsing and export engine",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(parse.router, prefix="/api", tags=["Parse"])
app.include_router(export.router, prefix="/api", tags=["Export"])


# ── Health Check ─────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "processor-svc"}
