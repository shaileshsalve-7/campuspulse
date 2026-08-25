import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, tokenSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(auth.register));
authRouter.post('/verify-email', validate(tokenSchema), asyncHandler(auth.verifyEmail));
authRouter.post('/resend-verification', validate(resendVerificationSchema), asyncHandler(auth.resendVerification));
authRouter.post('/login', validate(loginSchema), asyncHandler(auth.login));
authRouter.post('/refresh', asyncHandler(auth.refresh));
authRouter.post('/logout', asyncHandler(auth.logout));
authRouter.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(auth.forgotPassword));
authRouter.post('/reset-password', validate(resetPasswordSchema), asyncHandler(auth.resetPassword));
authRouter.get('/me', requireAuth, asyncHandler(auth.me));
