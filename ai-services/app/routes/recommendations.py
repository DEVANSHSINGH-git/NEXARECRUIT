from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import structlog

from app.services.career_agent import CareerGuidanceService

logger = structlog.get_logger()

router = APIRouter()


class RecommendationRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    current_role: str = Field(default="")
    experience_years: int = Field(default=0, ge=0)
    target_domain: str = Field(default="")


class RecommendationResponse(BaseModel):
    recommended_roles: list[str]
    career_roadmap: list[dict]
    skill_gaps: list[str]
    upskilling_suggestions: list[dict]
    market_insights: str


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_career_recommendations(request: RecommendationRequest):
    """Generate career recommendations based on resume analysis."""
    try:
        logger.info("Generating career recommendations")

        service = CareerGuidanceService()
        result = await service.generate_recommendations(
            resume_text=request.resume_text,
            current_role=request.current_role,
            experience_years=request.experience_years,
            target_domain=request.target_domain,
        )

        return result

    except Exception as e:
        logger.error("Recommendation generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")
