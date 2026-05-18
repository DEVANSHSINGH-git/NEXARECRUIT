import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { supabaseAdmin } from '../config/supabase';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.enum(['CANDIDATE', 'RECRUITER']),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

// POST /api/auth/register
authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists in our DB
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for dev
    user_metadata: { name, role },
  });

  if (authError) {
    logger.error('Supabase auth registration failed', { error: authError.message });
    throw new ConflictError(authError.message);
  }

  // Create user profile in our database (using Supabase auth UID)
  const user = await prisma.user.create({
    data: {
      id: authData.user.id, // Use Supabase auth UID
      name,
      email,
      password: 'managed-by-supabase', // Not used, Supabase handles passwords
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Sign in to get session tokens
  const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  logger.info(`User registered: ${user.email} as ${user.role}`);

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken: sessionData?.session?.access_token || '',
      refreshToken: sessionData?.session?.refresh_token || '',
    },
  });
});

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Authenticate with Supabase
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Get user profile from our database
  const user = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User profile not found. Please register first.');
  }

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  });
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  res.json({
    success: true,
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
