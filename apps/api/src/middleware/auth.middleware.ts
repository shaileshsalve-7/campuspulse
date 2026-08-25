import type { NextFunction, Request, Response } from 'express';
import { User, type UserRole } from '../models/user.model.js';
import { verifyAccessToken } from '../services/auth.service.js';
import { ApiError } from '../utils/api-error.js';

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; role: UserRole };
}

export async function requireAuth(request: AuthenticatedRequest, _response: Response, next: NextFunction): Promise<void> {
  try {
    const [scheme, token] = request.header('authorization')?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication is required.', 'AUTHENTICATION_REQUIRED');
    const claims = verifyAccessToken(token);
    const user = await User.findById(claims.sub).select('role isActive isEmailVerified');
    if (!user || !user.isActive || !user.isEmailVerified) {
      throw new ApiError(401, 'Your account is unavailable.', 'ACCOUNT_UNAVAILABLE');
    }
    request.auth = { userId: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    if (!request.auth) return next(new ApiError(401, 'Authentication is required.', 'AUTHENTICATION_REQUIRED'));
    if (!roles.includes(request.auth.role)) return next(new ApiError(403, 'You do not have access to this resource.', 'INSUFFICIENT_ROLE'));
    next();
  };
}
