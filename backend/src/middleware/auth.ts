import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../config/database';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.substring(7);

  try {
    // Verify the Supabase token
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user profile from our database
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!dbUser) {
      throw new UnauthorizedError('User profile not found');
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as AuthPayload['role'],
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Authentication failed');
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
