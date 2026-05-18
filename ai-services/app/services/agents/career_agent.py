"""
Career Guidance Agent
Generates career recommendations, roadmaps, and upskilling suggestions using Groq LLM.
"""

import json
from openai import AsyncOpenAI
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

CAREER_PROMPT = """You are a Career Guidance Agent. Based on the candidate's resume, the target job, and their evaluation scores, generate personalized career recommendations.

Provide:
1. **Recommended Roles** - 3-5 roles the candidate is well-suited for
2. **Career Roadmap** - Steps to reach their target role
3. **Skill Gaps** - Specific skills to develop
4. **Upskilling Suggestions** - Courses, certifications, or resources for each gap
5. **Market Insights** - Brief note on demand for their skillset

Return ONLY valid JSON:
{
  "roles": ["Role 1", "Role 2", "Role 3"],
  "roadmap": [
    {"step": 1, "action": "Action description", "timeline": "1-3 months"},
    {"step": 2, "action": "Action description", "timeline": "3-6 months"}
  ],
  "skill_gaps": ["skill1", "skill2"],
  "upskilling": [
    {"skill": "skill1", "resource": "Resource name", "type": "course/certification/project", "priority": "high/medium/low"}
  ],
  "market_insights": "Brief market demand analysis"
}

Resume Data:
{resume_data}

Target Job:
{jd_data}

Current Scores:
{scores}
"""


class CareerGuidanceAgent:
    """Agent responsible for generating career recommendations."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def recommend(self, resume_data: dict, jd_data: dict, scores: dict) -> dict:
        """Generate career guidance and recommendations."""
        try:
            prompt = CAREER_PROMPT.format(
                resume_data=json.dumps(resume_data, indent=2)[:3000],
                jd_data=json.dumps(jd_data, indent=2)[:2000],
                scores=json.dumps(scores, indent=2),
            )

            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a career guidance specialist. Provide realistic, actionable recommendations. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            recommendations = json.loads(content)

            logger.info(
                "Career recommendations generated",
                roles=len(recommendations.get("roles", [])),
                roadmap_steps=len(recommendations.get("roadmap", [])),
            )

            return recommendations

        except Exception as e:
            logger.error("Career guidance failed", error=str(e))
            return {
                "roles": [],
                "roadmap": [],
                "skill_gaps": [],
                "upskilling": [],
                "market_insights": "Unable to generate market insights at this time.",
            }
