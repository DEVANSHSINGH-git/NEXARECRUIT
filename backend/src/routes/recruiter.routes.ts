import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

export const recruiterRouter = Router();

// All recruiter routes require authentication
recruiterRouter.use(authenticate);
recruiterRouter.use(authorize('RECRUITER', 'ADMIN'));

// GET /api/recruiter/dashboard
recruiterRouter.get('/dashboard', async (req: Request, res: Response) => {
  const cacheKey = `recruiter:dashboard:${req.user!.userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    return;
  }

  const [totalCandidates, totalEvaluations, recentEvaluations, topCandidates] = await Promise.all([
    prisma.user.count({ where: { role: 'CANDIDATE' } }),
    prisma.evaluation.count(),
    prisma.evaluation.findMany({
      include: {
        resume: { include: { user: { select: { name: true, email: true } } } },
        jobDescription: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.evaluation.findMany({
      where: { atsScore: { gte: 70 } },
      include: {
        resume: { include: { user: { select: { name: true, email: true } } } },
        jobDescription: true,
      },
      orderBy: { atsScore: 'desc' },
      take: 10,
    }),
  ]);

  const dashboardData = {
    stats: {
      totalCandidates,
      totalEvaluations,
      averageScore: recentEvaluations.length > 0
        ? recentEvaluations.reduce((sum, e) => sum + (e.atsScore || 0), 0) / recentEvaluations.length
        : 0,
    },
    recentEvaluations,
    topCandidates,
  };

  await cacheSet(cacheKey, dashboardData, 120); // 2 min cache

  res.json({ success: true, data: dashboardData });
});

// GET /api/recruiter/candidates
recruiterRouter.get('/candidates', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', sortBy = 'createdAt', order = 'desc' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [candidates, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CANDIDATE' },
      include: {
        resumes: {
          include: {
            evaluations: {
              orderBy: { atsScore: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { [sortBy as string]: order },
      skip,
      take,
    }),
    prisma.user.count({ where: { role: 'CANDIDATE' } }),
  ]);

  res.json({
    success: true,
    data: {
      candidates,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    },
  });
});

// GET /api/recruiter/candidates/:id
recruiterRouter.get('/candidates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const candidate = await prisma.user.findFirst({
    where: { id, role: 'CANDIDATE' },
    include: {
      resumes: {
        include: {
          evaluations: {
            include: {
              jobDescription: true,
              recommendation: true,
            },
          },
        },
      },
    },
  });

  if (!candidate) {
    res.status(404).json({ success: false, error: { message: 'Candidate not found' } });
    return;
  }

  res.json({ success: true, data: candidate });
});

// POST /api/recruiter/shortlist
recruiterRouter.post('/shortlist', async (req: Request, res: Response) => {
  const { evaluationId, notes } = req.body;
  const recruiterId = req.user!.userId;

  const action = await prisma.recruiterAction.create({
    data: {
      recruiterId,
      evaluationId,
      action: 'SHORTLISTED',
      notes,
    },
  });

  res.status(201).json({ success: true, data: action });
});

// GET /api/recruiter/shortlisted
recruiterRouter.get('/shortlisted', async (req: Request, res: Response) => {
  const recruiterId = req.user!.userId;

  const shortlisted = await prisma.recruiterAction.findMany({
    where: { recruiterId, action: 'SHORTLISTED' },
    include: {
      evaluation: {
        include: {
          resume: { include: { user: { select: { name: true, email: true } } } },
          jobDescription: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: shortlisted });
});

// POST /api/recruiter/compare
recruiterRouter.post('/compare', async (req: Request, res: Response) => {
  const { evaluationIds } = req.body;

  if (!evaluationIds || !Array.isArray(evaluationIds) || evaluationIds.length < 2) {
    res.status(400).json({ success: false, error: { message: 'Provide at least 2 evaluation IDs' } });
    return;
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { id: { in: evaluationIds } },
    include: {
      resume: { include: { user: { select: { name: true, email: true } } } },
      jobDescription: true,
      recommendation: true,
    },
  });

  res.json({ success: true, data: evaluations });
});
