"""
Career Guidance Service
Standalone service for generating career recommendations without evaluation context.
"""

import json
from openai import AsyncOpenAI
import structlog

from app.config import get_settings
from app.services.agents.resume_agent import ResumeIntelligenceAgent

logger = structlog.get_logger()
settings = get_settings()

STANDALONE_CAREER_PROMPT = """You are a Career Intelligence Agent. Based on the candidate's resume analysis, generate comprehensive career recommendations.

Context:
- Current Role: {current_role}
- Experience: {experience_years} years
- Target Domain: {target_domain}

Provide personalized recommendations including:
1. Top 5 recommended roles based on their profile
2. A step-by-step career roadmap (6-12 months)
3. Key skill gaps to address
4. Specific upskilling resources
5. Market demand insights for their skillset

Return ONLY valid JSON:
{{
  "recommended_roles": ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"],
  "career_roadmap": [
    {{"step": 1, "action": "Description", "timeline": "1-2 months", "priority": "high"}},
    {{"step": 2, "action": "Description", "timeline": "2-4 months", "priority": "medium"}}
  ],
  "skill_gaps": ["skill1", "skill2", "skill3"],
  "upskilling_suggestions": [
    {{"skill": "skill1", "resource": "Resource name", "type": "course", "url_hint": "platform name", "priority": "high"}}
  ],
  "market_insights": "Brief analysis of market demand and trends"
}}

Resume Analysis:
{resume_data}
"""


class CareerGuidanceService:
    """Standalone career guidance service."""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        self.resume_agent = ResumeIntelligenceAgent(self.client)

    async def generate_recommendations(
        self,
        resume_text: str,
        current_role: str = "",
        experience_years: int = 0,
        target_domain: str = "",
    ) -> dict:
        """Generate career recommendations from resume text."""

        # First extract structured resume data
        resume_data = await self.resume_agent.extract(resume_text)

        # Infer experience if not provided
        if experience_years == 0:
            experience_years = resume_data.get("total_experience_years", 0)

        prompt = STANDALONE_CAREER_PROMPT.format(
            current_role=current_role or "Not specified",
            experience_years=experience_years,
            target_domain=target_domain or "General",
            resume_data=json.dumps(resume_data, indent=2)[:4000],
        )

        try:
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a career intelligence specialist. Provide realistic, data-informed career guidance. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            logger.info("Standalone career recommendations generated")
            return result

        except Exception as e:
            logger.error("Career guidance service failed", error=str(e))
            return {
                "recommended_roles": [],
                "career_roadmap": [],
                "skill_gaps": [],
                "upskilling_suggestions": [],
                "market_insights": "Service temporarily unavailable.",
            }
