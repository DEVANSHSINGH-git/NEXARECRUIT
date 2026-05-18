"""
Semantic Matching Agent
Computes semantic alignment between resume and job description using local embeddings.
Uses sentence-transformers for free, fast embedding generation.
"""

import json
from openai import AsyncOpenAI
import numpy as np
import structlog
from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Load embedding model once (cached in memory)
_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


class SemanticMatchingAgent:
    """Agent responsible for computing semantic similarity between resume and JD."""

    def __init__(self, client: AsyncOpenAI):
        self.client = client
        self.model = get_embedding_model()

    async def compute_alignment(self, resume_data: dict, jd_data: dict) -> dict:
        """
        Compute semantic alignment between resume and JD data.
        Uses sentence-transformers for local embedding generation.
        """
        try:
            # Build text representations for embedding
            resume_text = self._build_resume_representation(resume_data)
            jd_text = self._build_jd_representation(jd_data)

            # Generate embeddings locally (fast, free)
            resume_embedding = self.model.encode(resume_text).tolist()
            jd_embedding = self.model.encode(jd_text).tolist()

            # Compute cosine similarity
            overall_similarity = self._cosine_similarity(resume_embedding, jd_embedding)

            # Compute skill-level alignment
            skill_alignment = self._compute_skill_alignment(resume_data, jd_data)

            result = {
                "overall_similarity": round(overall_similarity * 100, 2),
                "skill_alignment": skill_alignment,
                "matched_skills": skill_alignment.get("matched", []),
                "missing_skills": skill_alignment.get("missing", []),
                "extra_skills": skill_alignment.get("extra", []),
            }

            logger.info(
                "Semantic matching completed",
                similarity=result["overall_similarity"],
                matched_skills=len(result["matched_skills"]),
            )

            return result

        except Exception as e:
            logger.error("Semantic matching failed", error=str(e))
            return {
                "overall_similarity": 50.0,
                "skill_alignment": {"matched": [], "missing": [], "extra": [], "match_percentage": 50.0},
                "matched_skills": [],
                "missing_skills": [],
                "extra_skills": [],
            }

    def _cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    def _build_resume_representation(self, resume_data: dict) -> str:
        """Build a text representation of the resume for embedding."""
        parts = []

        skills = resume_data.get("skills", {})
        if isinstance(skills, dict):
            all_skills = skills.get("technical", []) + skills.get("tools", [])
            if all_skills:
                parts.append(f"Skills: {', '.join(all_skills)}")

        experience = resume_data.get("experience", [])
        for exp in experience[:5]:
            if isinstance(exp, dict):
                parts.append(f"{exp.get('title', '')} at {exp.get('company', '')}")
                resps = exp.get("responsibilities", [])
                if resps:
                    parts.append(". ".join(resps[:3]))

        projects = resume_data.get("projects", [])
        for proj in projects[:3]:
            if isinstance(proj, dict):
                parts.append(f"Project: {proj.get('name', '')} - {proj.get('description', '')}")

        return "\n".join(parts)

    def _build_jd_representation(self, jd_data: dict) -> str:
        """Build a text representation of the JD for embedding."""
        parts = []

        title = jd_data.get("title", "")
        if title:
            parts.append(f"Role: {title}")

        required = jd_data.get("required_skills", [])
        if required:
            parts.append(f"Required Skills: {', '.join(required)}")

        preferred = jd_data.get("preferred_skills", [])
        if preferred:
            parts.append(f"Preferred Skills: {', '.join(preferred)}")

        responsibilities = jd_data.get("responsibilities", [])
        if responsibilities:
            parts.append(f"Responsibilities: {'. '.join(responsibilities[:5])}")

        return "\n".join(parts)

    def _compute_skill_alignment(self, resume_data: dict, jd_data: dict) -> dict:
        """Compute direct skill overlap between resume and JD."""
        # Normalize skills for comparison
        resume_skills = set()
        skills = resume_data.get("skills", {})
        if isinstance(skills, dict):
            for category in ["technical", "soft", "tools"]:
                for skill in skills.get(category, []):
                    resume_skills.add(skill.lower().strip())
        elif isinstance(skills, list):
            for skill in skills:
                resume_skills.add(str(skill).lower().strip())

        required_skills = set(
            s.lower().strip() for s in jd_data.get("required_skills", [])
        )
        preferred_skills = set(
            s.lower().strip() for s in jd_data.get("preferred_skills", [])
        )

        all_jd_skills = required_skills | preferred_skills

        matched = list(resume_skills & all_jd_skills)
        missing = list(all_jd_skills - resume_skills)
        extra = list(resume_skills - all_jd_skills)

        match_percentage = (
            (len(matched) / len(all_jd_skills) * 100) if all_jd_skills else 50.0
        )

        return {
            "matched": matched,
            "missing": missing,
            "extra": extra,
            "match_percentage": round(match_percentage, 2),
        }
