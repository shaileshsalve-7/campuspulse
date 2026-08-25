import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/campuspulse'),
  MONGODB_URI_TEMPLATE: z.string().min(1).optional(),
  MONGODB_PASSWORD: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-me-000'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  MAIL_MODE: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
  COLLEGE_EMAIL_DOMAIN: z.string().optional(),
}).superRefine((value, context) => {
  if (value.MAIL_MODE !== 'smtp') return;
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'] as const) {
    if (!value[key]) context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when MAIL_MODE=smtp.` });
  }
}).transform((value) => {
  if (!value.MONGODB_URI_TEMPLATE || !value.MONGODB_PASSWORD) return value;

  return {
    ...value,
    MONGODB_URI: value.MONGODB_URI_TEMPLATE.replace('__PASSWORD__', encodeURIComponent(value.MONGODB_PASSWORD)),
  };
});

export const env = environmentSchema.parse(process.env);
