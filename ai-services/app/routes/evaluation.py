from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import structlog

from app.services.evaluation_pipeline import EvaluationPipeline

logger = structlog.get_logger()

router = APIRouter()


class EvaluationRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, description="Parsed resume content")
    job_description: str = Field(..., min_length=50, description="Job description text")
    job_title: Optional[str] = Field(None, description="Job title")


class EvaluationResponse(BaseModel):
    ats_score: float
    skills_match: float
    experience_match: float
    domain_score: float
    quality_score: float
    feedback: dict
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    recommendations: Optional[dict] = None


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_candidate(request: EvaluationRequest):
    """
    Run the full AI evaluation pipeline:
    1. Resume Intelligence Agent - Parse & structure resume
    2. Job Understanding Agent - Analyze JD requirements
    3. Semantic Matching Agent - Compare embeddings
    4. Scoring & Evaluation Agent - Generate weighted scores
    5. Reasoning & Feedback Agent - Explain results
    6. Career Guidance Agent - Generate recommendations
    """
    try:
        logger.info(
            "Starting evaluation pipeline",
            resume_length=len(request.resume_text),
            jd_length=len(request.job_description),
        )

        pipeline = EvaluationPipeline()
        result = await pipeline.run(
            resume_text=request.resume_text,
            job_description=request.job_description,
            job_title=request.job_title,
        )

        logger.info("Evaluation completed", ats_score=result.ats_score)
        return result

    except Exception as e:
        logger.error("Evaluation pipeline failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
