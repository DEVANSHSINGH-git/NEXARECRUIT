"""
Reasoning & Feedback Agent
Generates explainable evaluation outputs with strengths, weaknesses, and gaps using Groq LLM.
"""

import json
from openai import AsyncOpenAI
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

FEEDBACK_PROMPT = """You are a Candidate Evaluation Feedback Agent. Based on the resume analysis, job requirements, and scores, generate comprehensive, explainable feedback.

You must provide:
1. **Strengths** - What makes this candidate a good fit (3-5 points)
2. **Weaknesses** - Areas where the candidate falls short (2-4 points)
3. **Missing Skills** - Specific skills from the JD that the candidate lacks
4. **Detailed Feedback** - Category-by-category assessment

Be specific, actionable, and constructive. Reference actual skills and experiences from the resume.

Return ONLY valid JSON:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "missing_skills": ["skill1", "skill2"],
  "detailed_feedback": {
    "overall": "1-2 sentence overall assessment",
    "skills_assessment": "Assessment of skill alignment",
    "experience_assessment": "Assessment of experience relevance",
    "growth_potential": "Assessment of candidate's potential to grow into the role"
  },
  "fit_summary": "One sentence: why this candidate does or doesn't fit"
}

Resume Data:
{resume_data}

Job Requirements:
{jd_data}

Scores:
{scores}
"""


class FeedbackAgent:
    """Agent responsible for generating explainable evaluation feedback."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    async def generate_feedback(
        self, resume_data: dict, jd_data: dict, scores: dict
    ) -> dict:
        """Generate comprehensive feedback for the evaluation."""
        try:
            prompt = FEEDBACK_PROMPT.format(
                resume_data=json.dumps(resume_data, indent=2)[:3000],
                jd_data=json.dumps(jd_data, indent=2)[:2000],
                scores=json.dumps(scores, indent=2),
            )

            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a constructive and precise evaluation feedback agent. Be specific and actionable. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            feedback = json.loads(content)

            logger.info(
                "Feedback generated",
                strengths=len(feedback.get("strengths", [])),
                weaknesses=len(feedback.get("weaknesses", [])),
            )

            return feedback

        except Exception as e:
            logger.error("Feedback generation failed", error=str(e))
            return {
                "strengths": ["Unable to generate detailed strengths at this time"],
                "weaknesses": ["Unable to generate detailed weaknesses at this time"],
                "missing_skills": [],
                "detailed_feedback": {
                    "overall": "Evaluation completed but detailed feedback generation encountered an error."
                },
                "fit_summary": "Please retry the evaluation for detailed feedback.",
            }
