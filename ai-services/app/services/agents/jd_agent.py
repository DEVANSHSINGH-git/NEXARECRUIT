"""
Job Understanding Agent
Analyzes job descriptions to extract structured requirements using Groq LLM.
"""

import json
from typing import Optional
from openai import AsyncOpenAI
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

JD_ANALYSIS_PROMPT = """You are a Job Description Analysis Agent. Your task is to analyze the following job description and extract structured requirements.

Extract the following:
1. **Required Skills** - Must-have technical and non-technical skills
2. **Preferred Skills** - Nice-to-have skills
3. **Experience Requirements** - Years of experience, seniority level
4. **Education Requirements** - Degree requirements
5. **Domain/Industry** - Target domain or industry
6. **Responsibilities** - Key role responsibilities
7. **Role Level** - Junior/Mid/Senior/Lead/Principal

Return ONLY valid JSON in this exact format:
{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "experience_required": {
    "min_years": 0,
    "max_years": 0,
    "seniority": "mid"
  },
  "education": {
    "degree": "Bachelor's",
    "field": "Computer Science or related"
  },
  "domain": "Technology",
  "responsibilities": ["resp1", "resp2"],
  "role_level": "mid",
  "keywords": ["keyword1", "keyword2"],
  "title": "Job Title"
}

Job Description:
"""


class JobUnderstandingAgent:
    """Agent responsible for parsing and understanding job descriptions."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def analyze(self, job_description: str, job_title: Optional[str] = None) -> dict:
        """Analyze job description and extract structured requirements."""
        try:
            context = ""
            if job_title:
                context = f"Job Title: {job_title}\n\n"

            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise job description analysis agent. Extract structured requirements accurately. Return only valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": f"{JD_ANALYSIS_PROMPT}\n{context}{job_description}",
                    },
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            data = json.loads(content)

            if job_title and not data.get("title"):
                data["title"] = job_title

            logger.info(
                "JD analyzed",
                required_skills=len(data.get("required_skills", [])),
                role_level=data.get("role_level", "unknown"),
            )

            return data

        except json.JSONDecodeError as e:
            logger.error("Failed to parse JD analysis response", error=str(e))
            return self._empty_result(job_title)
        except Exception as e:
            logger.error("JD analysis failed", error=str(e))
            return self._empty_result(job_title)

    def _empty_result(self, title: Optional[str] = None) -> dict:
        return {
            "required_skills": [],
            "preferred_skills": [],
            "experience_required": {"min_years": 0, "max_years": 0, "seniority": "unknown"},
            "education": {"degree": "", "field": ""},
            "domain": "",
            "responsibilities": [],
            "role_level": "unknown",
            "keywords": [],
            "title": title or "Unknown",
        }
