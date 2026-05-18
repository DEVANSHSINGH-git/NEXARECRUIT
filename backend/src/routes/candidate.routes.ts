import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { NotFoundError } from '../utils/errors';
import axios from 'axios';

export const candidateRouter = Router();

// All candidate routes require authentication
candidateRouter.use(authenticate);
candidateRouter.use(authorize('CANDIDATE', 'ADMIN'));

// GET /api/candidate/dashboard
candidateRouter.get('/dashboard', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Check cache first
  const cacheKey = `candidate:dashboard:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    return;
  }

  const [resumes, evaluations, recommendations] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.evaluation.findMany({
      where: { resume: { userId } },
      include: { jobDescription: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.recommendation.findMany({
      where: { evaluation: { resume: { userId } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const dashboardData = {
    resumes,
    evaluations,
    recommendations,
    stats: {
      totalEvaluations: evaluations.length,
      averageScore: evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.atsScore || 0), 0) / evaluations.length
        : 0,
      totalResumes: resumes.length,
    },
  };

  await cacheSet(cacheKey, dashboardData, 300); // 5 min cache

  res.json({ success: true, data: dashboardData });
});

// GET /api/candidate/evaluations
candidateRouter.get('/evaluations', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const evaluations = await prisma.evaluation.findMany({
    where: { resume: { userId } },
    include: {
      jobDescription: true,
      resume: { select: { fileName: true } },
      recommendation: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: evaluations });
});

// GET /api/candidate/evaluations/:id
candidateRouter.get('/evaluations/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id,
      resume: { userId },
    },
    include: {
      jobDescription: true,
      resume: true,
      recommendation: true,
    },
  });

  if (!evaluation) {
    throw new NotFoundError('Evaluation not found');
  }

  res.json({ success: true, data: evaluation });
});

// GET /api/candidate/profile
candidateRouter.get('/profile', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      resumes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  res.json({ success: true, data: profile });
});

// POST /api/candidate/recommendations
candidateRouter.post('/recommendations', async (req: Request, res: Response) => {
  const { resumeText, currentRole, experienceYears, targetDomain } = req.body;

  if (!resumeText || resumeText.length < 50) {
    res.status(400).json({ success: false, error: 'Resume text must be at least 50 characters' });
    return;
  }

  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiResponse = await axios.post(`${aiServiceUrl}/api/recommendations`, {
      resume_text: resumeText,
      current_role: currentRole || '',
      experience_years: experienceYears || 0,
      target_domain: targetDomain || '',
    }, { timeout: 60000 });

    res.json({ success: true, data: aiResponse.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});
