"""
Scoring & Evaluation Agent
Generates weighted ATS scores based on multi-dimensional analysis using Groq LLM.
"""

import json
from openai import AsyncOpenAI
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Scoring weights as defined in the project spec
SCORING_WEIGHTS = {
    "skills_match": 0.40,
    "experience_match": 0.25,
    "project_relevance": 0.15,
    "domain_alignment": 0.10,
    "resume_quality": 0.10,
}

SCORING_PROMPT = """You are a precise Candidate Scoring Agent. Based on the following resume data, job requirements, and semantic matching results, generate accurate scores for each dimension.

Scoring Criteria:
- Skills Match (0-100): How well the candidate's skills align with required and preferred skills
- Experience Match (0-100): How well the candidate's experience level and type matches the role
- Project Relevance (0-100): How relevant the candidate's projects are to the role
- Domain Alignment (0-100): How well the candidate's domain expertise matches
- Resume Quality (0-100): Overall resume clarity, completeness, and professionalism

Consider:
- Exact skill matches get full credit
- Related/adjacent skills get partial credit
- Experience years vs. requirements
- Seniority level alignment
- Domain/industry relevance

Return ONLY valid JSON:
{
  "skills_match": 0,
  "experience_match": 0,
  "project_relevance": 0,
  "domain_alignment": 0,
  "resume_quality": 0,
  "reasoning": {
    "skills": "brief explanation",
    "experience": "brief explanation",
    "projects": "brief explanation",
    "domain": "brief explanation",
    "quality": "brief explanation"
  }
}

Resume Data:
{resume_data}

Job Requirements:
{jd_data}

Semantic Matching Results:
{matching_data}
"""


class ScoringAgent:
    """Agent responsible for generating weighted evaluation scores."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def compute_scores(
        self, resume_data: dict, jd_data: dict, matching_result: dict
    ) -> dict:
        """Compute weighted scores for the candidate evaluation."""
        try:
            prompt = SCORING_PROMPT.format(
                resume_data=json.dumps(resume_data, indent=2)[:3000],
                jd_data=json.dumps(jd_data, indent=2)[:2000],
                matching_data=json.dumps(matching_result, indent=2)[:1500],
            )

            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise scoring agent. Generate accurate, justified scores. Be fair but rigorous. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            scores_raw = json.loads(content)

            # Validate and clamp scores
            skills_match = self._clamp(scores_raw.get("skills_match", 50))
            experience_match = self._clamp(scores_raw.get("experience_match", 50))
            project_relevance = self._clamp(scores_raw.get("project_relevance", 50))
            domain_alignment = self._clamp(scores_raw.get("domain_alignment", 50))
            resume_quality = self._clamp(scores_raw.get("resume_quality", 50))

            # Compute weighted ATS score
            ats_score = (
                skills_match * SCORING_WEIGHTS["skills_match"]
                + experience_match * SCORING_WEIGHTS["experience_match"]
                + project_relevance * SCORING_WEIGHTS["project_relevance"]
                + domain_alignment * SCORING_WEIGHTS["domain_alignment"]
                + resume_quality * SCORING_WEIGHTS["resume_quality"]
            )

            result = {
                "ats_score": round(ats_score, 1),
                "skills_match": round(skills_match, 1),
                "experience_match": round(experience_match, 1),
                "domain_score": round(domain_alignment, 1),
                "quality_score": round(resume_quality, 1),
                "project_relevance": round(project_relevance, 1),
                "reasoning": scores_raw.get("reasoning", {}),
            }

            logger.info(
                "Scores computed",
                ats_score=result["ats_score"],
                skills_match=result["skills_match"],
            )

            return result

        except Exception as e:
            logger.error("Scoring failed", error=str(e))
            return self._fallback_scores(matching_result)

    def _clamp(self, value: float) -> float:
        """Clamp score to 0-100 range."""
        try:
            return max(0.0, min(100.0, float(value)))
        except (TypeError, ValueError):
            return 50.0

    def _fallback_scores(self, matching_result: dict) -> dict:
        """Generate fallback scores from matching data when LLM fails."""
        similarity = matching_result.get("overall_similarity", 50.0)
        skill_pct = matching_result.get("skill_alignment", {}).get("match_percentage", 50.0)

        return {
            "ats_score": round((similarity + skill_pct) / 2, 1),
            "skills_match": round(skill_pct, 1),
            "experience_match": 50.0,
            "domain_score": round(similarity * 0.8, 1),
            "quality_score": 60.0,
            "project_relevance": 50.0,
            "reasoning": {"note": "Fallback scoring used due to LLM error"},
        }
