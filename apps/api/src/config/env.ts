import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  // ✅ Allow comma-separated origins from .env, or default to localhost
  corsOrigins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ["http://localhost:5173", "http://localhost:5174"] 
};

// 🛡️ SECURITY CHECKS (Fail Fast)
if (!config.mongoUri) {
  throw new Error("❌ FATAL: MONGO_URI is missing in .env file");
}
if (!config.jwtSecret) {
  // 🛑 STOP SERVER: Never run with a fallback secret in production
  throw new Error("❌ FATAL: JWT_SECRET is missing. Cannot start securely.");
}