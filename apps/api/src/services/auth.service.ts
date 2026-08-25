import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/refresh-token.model.js';
import type { UserDocument, UserRole } from '../models/user.model.js';
import { createOpaqueToken, hashValue } from '../utils/crypto.js';
import { ApiError } from '../utils/api-error.js';

type TokenClaims = JwtPayload & { sub: string; role: UserRole; jti?: string };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const accessExpiry = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'];
const refreshExpiry = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'];
const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createAuthTokens(user: UserDocument): Promise<AuthTokens> {
  const subject = user._id.toString();
  const tokenId = createOpaqueToken();
  const accessToken = jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, { subject, expiresIn: accessExpiry });
  const refreshToken = jwt.sign({ role: user.role }, env.JWT_REFRESH_SECRET, { subject, jwtid: tokenId, expiresIn: refreshExpiry });

  await RefreshToken.create({
    userId: user._id,
    tokenId,
    tokenHash: hashValue(refreshToken),
    expiresAt: new Date(Date.now() + refreshLifetimeMs),
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenClaims {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenClaims;
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired.', 'INVALID_ACCESS_TOKEN');
  }
}

export async function rotateRefreshToken(token: string): Promise<{ userId: string; role: UserRole; tokens: AuthTokens }> {
  let claims: TokenClaims;
  try {
    claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenClaims;
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired.', 'INVALID_REFRESH_TOKEN');
  }

  if (!claims.sub || !claims.jti) throw new ApiError(401, 'Your session is invalid.', 'INVALID_REFRESH_TOKEN');
  const stored = await RefreshToken.findOne({ tokenId: claims.jti }).select('+tokenHash');
  if (!stored || stored.tokenHash !== hashValue(token)) {
    throw new ApiError(401, 'Your session is no longer active.', 'REFRESH_TOKEN_REUSED');
  }

  await RefreshToken.deleteOne({ _id: stored._id });
  const user = await (await import('../models/user.model.js')).User.findById(claims.sub).select('+passwordHash');
  if (!user || !user.isActive) throw new ApiError(401, 'Your account is unavailable.', 'ACCOUNT_UNAVAILABLE');
  return { userId: user._id.toString(), role: user.role, tokens: await createAuthTokens(user) };
}

export async function revokeRefreshToken(token: string | undefined): Promise<void> {
  if (!token) return;
  try {
    const claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenClaims;
    if (claims.jti) await RefreshToken.deleteOne({ tokenId: claims.jti });
  } catch {
    // Logout should be idempotent, including for expired cookies.
  }
}
