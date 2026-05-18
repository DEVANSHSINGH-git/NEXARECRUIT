import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5000;

let dbConnected = false;

async function connectDatabase(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      logger.info('Supabase PostgreSQL connected successfully');
      return true;
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      if (error?.errorCode === 'P1001') {
        logger.warn(`Database unreachable (attempt ${i + 1}/${retries}) - Supabase project may be paused`);
      } else {
        logger.warn(`Database connection failed (attempt ${i + 1}/${retries}):`, error?.message);
      }
      if (!isLastAttempt) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  return false;
}

async function bootstrap() {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Try database connection (with retries)
    dbConnected = await connectDatabase(3);
    if (!dbConnected) {
      logger.warn('Starting server WITHOUT database - some endpoints will return 503');
      logger.warn('If using Supabase free tier, go to https://supabase.com/dashboard and restore your project');
    }

    // Try Redis connection (optional - graceful fallback)
    try {
      await redis.connect();
      logger.info('Redis connected successfully');
    } catch {
      logger.warn('Redis not available - running without cache');
    }

    app.listen(PORT, () => {
      logger.info(`NexaRecruit API Gateway running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${dbConnected ? 'CONNECTED' : 'UNAVAILABLE (server running in degraded mode)'}`);
    });

    // Retry DB connection in background if it failed
    if (!dbConnected) {
      setTimeout(async () => {
        dbConnected = await connectDatabase(1);
        if (dbConnected) logger.info('Database reconnected successfully!');
      }, 30000);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

bootstrap();
