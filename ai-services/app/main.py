from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import get_settings
from app.routes import evaluation, parsing, health, recommendations

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
)

logger = structlog.get_logger()

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI Service Layer for NexaRecruit - Multi-Agent Talent Intelligence",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(parsing.router, prefix="/api", tags=["Resume Parsing"])
app.include_router(evaluation.router, prefix="/api", tags=["Evaluation"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])


@app.on_event("startup")
async def startup_event():
    logger.info("NexaRecruit AI Services starting", model=settings.GROQ_MODEL)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("NexaRecruit AI Services shutting down")
