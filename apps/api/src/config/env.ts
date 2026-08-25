import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/campuspulse'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-me-000'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  MAIL_MODE: z.enum(['console', 'smtp']).default('console'),
  COLLEGE_EMAIL_DOMAIN: z.string().optional(),
});

export const env = environmentSchema.parse(process.env);
