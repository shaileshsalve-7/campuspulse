import { z } from 'zod';

const password = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.');

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required.').max(50),
    lastName: z.string().trim().min(1, 'Last name is required.').max(50),
    email: z.string().trim().email('Enter a valid college email.').max(254),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) }),
});

export const tokenSchema = z.object({ body: z.object({ token: z.string().min(20).max(256) }) });

export const forgotPasswordSchema = z.object({ body: z.object({ email: z.string().trim().email() }) });

export const resendVerificationSchema = z.object({ body: z.object({ email: z.string().trim().email() }) });

export const resetPasswordSchema = z.object({ body: z.object({ token: z.string().min(20).max(256), password }) });
