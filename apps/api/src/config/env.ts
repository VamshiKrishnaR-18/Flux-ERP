import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  MONGO_URI: z.string().min(1, "MONGO_URI is required").default(isTest ? 'mongodb://localhost:27017/test' : 'mongodb://127.0.0.1:27017/flux-erp'),
  JWT_SECRET: z.string().optional(),
  
  JWT_EXPIRES_IN: z.string().default('1d').transform(val => val.trim() === '' ? '1d' : val),
  COOKIE_EXPIRES_IN_HOURS: z.coerce.number().default(24),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

// Validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errorMsg = `❌ Invalid environment variables: ${JSON.stringify(parsedEnv.error.format())}`;
  console.error(errorMsg);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('CRITICAL_ENV_ERROR:', errorMsg);
  } else {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : ({} as any);

export const config = {
  port: env.PORT || 3001,
  mongoUri: env.MONGO_URI || '',
  jwtSecret: env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
  cookieExpiresInHours: env.COOKIE_EXPIRES_IN_HOURS || 24,
  nodeEnv: (env.NODE_ENV as any) || 'development',
  corsOrigin: env.CORS_ORIGIN || [],
  frontendUrl: env.FRONTEND_URL || '',
  smtpHost: env.SMTP_HOST || '',
  smtpPort: env.SMTP_PORT || 587,
  smtpUser: env.SMTP_USER || '',
  smtpPass: env.SMTP_PASS || '',
  groqApiKey: env.GROQ_API_KEY || '',
} as const;