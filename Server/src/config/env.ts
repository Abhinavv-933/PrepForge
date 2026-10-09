import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const envPath = fileURLToPath(new URL('../../../.env', import.meta.url));

dotenv.config({
  path: envPath,
});

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  CLIENT_ORIGIN: z.url(),

  GEMINI_API_KEY: z.string().optional(),

  GROQ_API_KEY: z.string().optional(),

  ALLOW_PRIVATE_URLS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:');
  console.error(z.prettifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
