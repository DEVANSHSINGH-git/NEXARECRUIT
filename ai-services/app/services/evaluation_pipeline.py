"""
NexaRecruit Evaluation Pipeline
Multi-agent orchestration for resume-JD evaluation using Groq LLM.
"""

import json
from typing import Optional
from openai import AsyncOpenAI
import structlog

from app.config import get_settings
from app.services.agents.resume_agent import ResumeIntelligenceAgent
from app.services.agents.jd_agent import JobUnderstandingAgent
from app.services.agents.matching_agent import SemanticMatchingAgent
from app.services.agents.scoring_agent import ScoringAgent
from app.services.agents.feedback_agent import FeedbackAgent
from app.services.agents.career_agent import CareerGuidanceAgent

logger = structlog.get_logger()
settings = get_settings()


class EvaluationResult:
    def __init__(self):
        self.ats_score: float = 0.0
        self.skills_match: float = 0.0
        self.experience_match: float = 0.0
        self.domain_score: float = 0.0
        self.quality_score: float = 0.0
        self.feedback: dict = {}
        self.strengths: list[str] = []
        self.weaknesses: list[str] = []
        self.missing_skills: list[str] = []
        self.recommendations: Optional[dict] = None


class EvaluationPipeline:
    """
    Orchestrates the multi-agent evaluation pipeline.

    Pipeline stages:
    1. Resume Intelligence → Extract structured data from resume
    2. Job Understanding → Parse JD into requirements
    3. Semantic Matching → Compare resume-JD alignment
    4. Scoring → Generate weighted scores
    5. Feedback → Generate explainable assessment
    6. Career Guidance → Generate recommendations
    """

    def __init__(self):
        # Groq uses OpenAI-compatible API
        self.client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        self.resume_agent = ResumeIntelligenceAgent(self.client)
        self.jd_agent = JobUnderstandingAgent(self.client)
        self.matching_agent = SemanticMatchingAgent(self.client)
        self.scoring_agent = ScoringAgent(self.client)
        self.feedback_agent = FeedbackAgent(self.client)
        self.career_agent = CareerGuidanceAgent(self.client)

    async def run(
        self,
        resume_text: str,
        job_description: str,
        job_title: Optional[str] = None,
    ) -> EvaluationResult:
        """Execute the full evaluation pipeline."""

        result = EvaluationResult()

        # Stage 1: Resume Intelligence
        logger.info("Pipeline Stage 1: Resume Intelligence")
        resume_data = await self.resume_agent.extract(resume_text)

        # Stage 2: Job Understanding
        logger.info("Pipeline Stage 2: Job Understanding")
        jd_data = await self.jd_agent.analyze(job_description, job_title)

        # Stage 3: Semantic Matching
        logger.info("Pipeline Stage 3: Semantic Matching")
        matching_result = await self.matching_agent.compute_alignment(
            resume_data, jd_data
        )

        # Stage 4: Scoring
        logger.info("Pipeline Stage 4: Scoring & Evaluation")
        scores = await self.scoring_agent.compute_scores(
            resume_data, jd_data, matching_result
        )

        result.ats_score = scores["ats_score"]
        result.skills_match = scores["skills_match"]
        result.experience_match = scores["experience_match"]
        result.domain_score = scores["domain_score"]
        result.quality_score = scores["quality_score"]

        # Stage 5: Reasoning & Feedback
        logger.info("Pipeline Stage 5: Reasoning & Feedback")
        feedback = await self.feedback_agent.generate_feedback(
            resume_data, jd_data, scores
        )

        result.feedback = feedback.get("detailed_feedback", {})
        result.strengths = feedback.get("strengths", [])
        result.weaknesses = feedback.get("weaknesses", [])
        result.missing_skills = feedback.get("missing_skills", [])

        # Stage 6: Career Guidance
        logger.info("Pipeline Stage 6: Career Guidance")
        try:
            recommendations = await self.career_agent.recommend(
                resume_data, jd_data, scores
            )
            result.recommendations = recommendations
        except Exception as e:
            logger.warn("Career guidance stage failed", error=str(e))
            result.recommendations = None

        logger.info(
            "Evaluation pipeline completed",
            ats_score=result.ats_score,
            skills_match=result.skills_match,
        )

        return result
