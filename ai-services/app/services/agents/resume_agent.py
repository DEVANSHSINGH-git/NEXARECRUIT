"""
Resume Intelligence Agent
Extracts structured data from resume text using Groq LLM.
"""

import json
from openai import AsyncOpenAI
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

RESUME_EXTRACTION_PROMPT = """You are a Resume Intelligence Agent. Your task is to extract structured information from the following resume text.

Extract the following categories:
1. **Skills** - Technical skills, soft skills, tools, frameworks, languages
2. **Experience** - Job titles, companies, durations, responsibilities
3. **Education** - Degrees, institutions, graduation years
4. **Projects** - Notable projects with descriptions and technologies used
5. **Certifications** - Any certifications mentioned
6. **Summary** - A brief professional summary

Return ONLY valid JSON in this exact format:
{
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"]
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration",
      "responsibilities": ["resp1", "resp2"]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "Institution",
      "year": "Year"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": ["cert1", "cert2"],
  "total_experience_years": 0,
  "summary": "Brief professional summary"
}

Resume Text:
"""


class ResumeIntelligenceAgent:
    """Agent responsible for parsing and structuring resume data."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def extract(self, resume_text: str) -> dict:
        """Extract structured data from raw resume text."""
        try:
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise resume parsing agent. Extract structured data accurately. Return only valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": f"{RESUME_EXTRACTION_PROMPT}\n{resume_text}",
                    },
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            data = json.loads(content)

            logger.info(
                "Resume extracted",
                skills_count=len(data.get("skills", {}).get("technical", [])),
                experience_count=len(data.get("experience", [])),
            )

            return data

        except json.JSONDecodeError as e:
            logger.error("Failed to parse resume extraction response", error=str(e))
            return self._empty_result()
        except Exception as e:
            logger.error("Resume extraction failed", error=str(e))
            return self._empty_result()

    def _empty_result(self) -> dict:
        return {
            "skills": {"technical": [], "soft": [], "tools": []},
            "experience": [],
            "education": [],
            "projects": [],
            "certifications": [],
            "total_experience_years": 0,
            "summary": "",
        }
