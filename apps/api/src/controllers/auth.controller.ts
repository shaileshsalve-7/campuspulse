import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { User, publicUser, type UserDocument } from '../models/user.model.js';
import { createAuthTokens, hashPassword, revokeRefreshToken, rotateRefreshToken, verifyPassword } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { createOpaqueToken, hashValue } from '../utils/crypto.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const verificationLifetimeMs = 24 * 60 * 60 * 1000;
const resetLifetimeMs = 60 * 60 * 1000;

function setRefreshCookie(response: Response, refreshToken: string): void {
  response.cookie('campuspulse_refresh', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(response: Response): void {
  response.clearCookie('campuspulse_refresh', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth' });
}

function assertCollegeEmail(email: string): void {
  if (env.COLLEGE_EMAIL_DOMAIN && !email.toLowerCase().endsWith(`@${env.COLLEGE_EMAIL_DOMAIN.toLowerCase()}`)) {
    throw new ApiError(422, `Use your @${env.COLLEGE_EMAIL_DOMAIN} email address.`, 'COLLEGE_EMAIL_REQUIRED');
  }
}

function developmentToken(token: string) {
  return env.NODE_ENV !== 'production' && env.MAIL_MODE === 'console' ? { developmentToken: token } : {};
}

async function sendVerificationEmail(user: UserDocument, token: string): Promise<void> {
  await emailService.sendActionEmail({
    recipient: user.email,
    subject: 'Verify your CampusPulse account',
    actionUrl: `${env.APP_URL}/verify-email?token=${token}`,
  });
}

export async function register(request: Request, response: Response): Promise<Response> {
  const { firstName, lastName, email, password } = request.body;
  const normalizedEmail = email.toLowerCase();
  assertCollegeEmail(normalizedEmail);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_IN_USE');

  const verificationToken = createOpaqueToken();
  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    emailVerificationTokenHash: hashValue(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + verificationLifetimeMs),
  });
  await sendVerificationEmail(user, verificationToken);
  return sendSuccess(response, 201, 'Account created. Check your college email to verify it.', {
    user: publicUser(user),
    ...developmentToken(verificationToken),
  });
}

export async function verifyEmail(request: Request, response: Response): Promise<Response> {
  const tokenHash = hashValue(request.body.token);
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'This verification link is invalid or expired.', 'INVALID_VERIFICATION_TOKEN');
  }
  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return sendSuccess(response, 200, 'Email verified. You can now sign in.', { user: publicUser(user) });
}

export async function resendVerification(request: Request, response: Response): Promise<Response> {
  const normalizedEmail = request.body.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || user.isEmailVerified) {
    return sendSuccess(response, 200, 'If an unverified account exists, a verification link has been sent.');
  }
  const verificationToken = createOpaqueToken();
  user.emailVerificationTokenHash = hashValue(verificationToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + verificationLifetimeMs);
  await user.save();
  await sendVerificationEmail(user, verificationToken);
  return sendSuccess(response, 200, 'A new verification link has been sent to your college email.', developmentToken(verificationToken));
}

export async function login(request: Request, response: Response): Promise<Response> {
  const { email, password } = request.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled.', 'ACCOUNT_DISABLED');
  if (!user.isEmailVerified) throw new ApiError(403, 'Verify your college email before signing in.', 'EMAIL_NOT_VERIFIED');

  const tokens = await createAuthTokens(user);
  setRefreshCookie(response, tokens.refreshToken);
  return sendSuccess(response, 200, 'Welcome back to CampusPulse.', { user: publicUser(user), accessToken: tokens.accessToken });
}

export async function refresh(request: Request, response: Response): Promise<Response> {
  const token = request.cookies.campuspulse_refresh as string | undefined;
  if (!token) throw new ApiError(401, 'A refresh token is required.', 'REFRESH_TOKEN_REQUIRED');
  const { tokens, userId } = await rotateRefreshToken(token);
  setRefreshCookie(response, tokens.refreshToken);
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'Your account is unavailable.', 'ACCOUNT_UNAVAILABLE');
  return sendSuccess(response, 200, 'Session refreshed.', { user: publicUser(user), accessToken: tokens.accessToken });
}

export async function logout(request: Request, response: Response): Promise<Response> {
  await revokeRefreshToken(request.cookies.campuspulse_refresh as string | undefined);
  clearRefreshCookie(response);
  return sendSuccess(response, 200, 'You have been signed out.');
}

export async function forgotPassword(request: Request, response: Response): Promise<Response> {
  const { email } = request.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetTokenHash');
  if (!user) return sendSuccess(response, 200, 'If an account exists, password reset instructions have been sent.');

  const resetToken = createOpaqueToken();
  user.passwordResetTokenHash = hashValue(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + resetLifetimeMs);
  await user.save();
  await emailService.sendActionEmail({ recipient: user.email, subject: 'Reset your CampusPulse password', actionUrl: `${env.APP_URL}/reset-password?token=${resetToken}` });
  return sendSuccess(response, 200, 'If an account exists, password reset instructions have been sent.', developmentToken(resetToken));
}

export async function resetPassword(request: Request, response: Response): Promise<Response> {
  const { token, password } = request.body;
  const user = await User.findOne({ passwordResetTokenHash: hashValue(token) }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'This reset link is invalid or expired.', 'INVALID_RESET_TOKEN');
  }
  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  await (await import('../models/refresh-token.model.js')).RefreshToken.deleteMany({ userId: user._id });
  return sendSuccess(response, 200, 'Password updated. Please sign in with your new password.');
}

export async function me(request: AuthenticatedRequest, response: Response): Promise<Response> {
  const user = await User.findById(request.auth!.userId);
  if (!user) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
  return sendSuccess(response, 200, 'Current user retrieved.', { user: publicUser(user) });
}
