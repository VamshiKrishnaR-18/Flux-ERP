import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  
  JWT_EXPIRES_IN: z.string().default('1d').transform(val => val.trim() === '' ? '1d' : val),
  COOKIE_EXPIRES_IN_HOURS: z.coerce.number().default(24),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
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
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 4));
  process.exit(1);
}

export const env = parsedEnv.data;

export const config = {
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET || 'fallback_secret',
  clerkSecretKey: env.CLERK_SECRET_KEY,
  clerkPublishableKey: env.CLERK_PUBLISHABLE_KEY,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  cookieExpiresInHours: env.COOKIE_EXPIRES_IN_HOURS,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  frontendUrl: env.FRONTEND_URL,
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPass: env.SMTP_PASS,
  groqApiKey: env.GROQ_API_KEY,
} as const;