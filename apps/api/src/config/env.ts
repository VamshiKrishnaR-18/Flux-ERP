import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  
  // ✅ These are strings/numbers, but we will handle the strict typing in the controller
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieExpiresInHours: Number(process.env.COOKIE_EXPIRES_IN_HOURS) || 24,

  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ["http://localhost:5173", "http://localhost:5174"] 
};

// 🛡️ SECURITY CHECKS
if (!config.mongoUri) {
  throw new Error("❌ FATAL: MONGO_URI is missing in .env file");
}
if (!config.jwtSecret) {
  throw new Error("❌ FATAL: JWT_SECRET is missing. Cannot start securely.");
}