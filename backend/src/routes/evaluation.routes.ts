import { Router, Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../config/database';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export const evaluationRouter = Router();

evaluationRouter.use(authenticate);

const createEvaluationSchema = z.object({
  body: z.object({
    resumeId: z.string().uuid(),
    jobDescription: z.string().min(50).max(10000),
    jobTitle: z.string().min(2).max(200).optional(),
  }),
});

// POST /api/evaluations - Trigger AI Evaluation
evaluationRouter.post('/', validate(createEvaluationSchema), async (req: Request, res: Response) => {
  const { resumeId, jobDescription, jobTitle } = req.body;
  const userId = req.user!.userId;

  // Verify resume belongs to user
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new NotFoundError('Resume not found');
  }

  // Store/find job description
  const jd = await prisma.jobDescription.create({
    data: {
      title: jobTitle || 'Untitled Position',
      content: jobDescription,
      userId,
    },
  });

  // Check cache for existing evaluation
  const cacheKey = `evaluation:${resumeId}:${jd.id}`;
  const cachedEvaluation = await cacheGet(cacheKey);
  if (cachedEvaluation) {
    res.json({ success: true, data: cachedEvaluation, cached: true });
    return;
  }

  // Call AI Service for evaluation
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiResponse = await axios.post(`${aiServiceUrl}/api/evaluate`, {
      resume_text: resume.parsedContent,
      job_description: jobDescription,
      job_title: jobTitle,
    }, {
      timeout: 60000, // 60s timeout for AI processing
    });

    const aiResult = aiResponse.data;

    // Persist evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        resumeId,
        jobDescriptionId: jd.id,
        atsScore: aiResult.ats_score,
        skillsMatchScore: aiResult.skills_match,
        experienceScore: aiResult.experience_match,
        domainScore: aiResult.domain_score,
        qualityScore: aiResult.quality_score,
        feedback: aiResult.feedback,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        missingSkills: aiResult.missing_skills,
      },
    });

    // Create recommendation if available
    if (aiResult.recommendations) {
      await prisma.recommendation.create({
        data: {
          evaluationId: evaluation.id,
          recommendedRoles: aiResult.recommendations.roles,
          careerRoadmap: aiResult.recommendations.roadmap,
          skillGaps: aiResult.recommendations.skill_gaps,
          upskillingSuggestions: aiResult.recommendations.upskilling,
        },
      });
    }

    // Cache the result
    await cacheSet(cacheKey, evaluation, 1800); // 30 min cache

    // Invalidate dashboard caches
    await cacheDelete(`candidate:dashboard:${userId}`);

    logger.info(`Evaluation completed for resume ${resumeId}, score: ${evaluation.atsScore}`);

    const fullEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluation.id },
      include: { recommendation: true, jobDescription: true },
    });

    res.status(201).json({ success: true, data: fullEvaluation });
  } catch (error: any) {
    logger.error('AI service evaluation failed:', error.message);
    res.status(502).json({
      success: false,
      error: { code: 'AI_SERVICE_ERROR', message: 'Evaluation service temporarily unavailable' },
    });
  }
});

// GET /api/evaluations/:id
evaluationRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      resume: { include: { user: { select: { id: true, name: true } } } },
      jobDescription: true,
      recommendation: true,
    },
  });

  if (!evaluation) {
    throw new NotFoundError('Evaluation not found');
  }

  // Verify access
  const isOwner = evaluation.resume.user.id === req.user!.userId;
  const isRecruiter = req.user!.role === 'RECRUITER' || req.user!.role === 'ADMIN';

  if (!isOwner && !isRecruiter) {
    res.status(403).json({ success: false, error: { message: 'Access denied' } });
    return;
  }

  res.json({ success: true, data: evaluation });
});

// GET /api/evaluations - List evaluations with filters
evaluationRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const { minScore, maxScore, page = '1', limit = '20' } = req.query;

  const where: any = {};

  if (role === 'CANDIDATE') {
    where.resume = { userId };
  }

  if (minScore) where.atsScore = { ...where.atsScore, gte: parseInt(minScore as string) };
  if (maxScore) where.atsScore = { ...where.atsScore, lte: parseInt(maxScore as string) };

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [evaluations, total] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      include: {
        resume: { include: { user: { select: { name: true, email: true } } } },
        jobDescription: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.evaluation.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      evaluations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});
