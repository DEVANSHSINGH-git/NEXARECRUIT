import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

export const healthRouter = Router();

// GET /api/health
healthRouter.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // Database check (Supabase)
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }

  // Redis check (optional)
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
  } catch {
    checks.redis = 'unavailable';
  }

  const dbHealthy = checks.database === 'healthy';

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'nexarecruit-api',
    version: '1.0.0',
    checks,
  });
});
