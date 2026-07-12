from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, deal

app = FastAPI(
    title="AI Due Diligence Copilot API",
    description="FastAPI Backend for Phase 1 - Foundations",
    version="1.0.0",
)

# CORS middleware configuration
# Credentials=True is mandatory for httpOnly cookies exchange
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(deal.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Due Diligence Copilot API",
        "phase": 1
    }
