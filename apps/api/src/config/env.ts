import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: ["http://localhost:5173", "http://localhost:5174"]
};

// 🛡️ Fail Fast: Stop server immediately if critical keys are missing
if (!config.mongoUri) {
  throw new Error("❌ FATAL: MONGO_URI is missing in .env file");
}
if (!config.jwtSecret) {
  console.warn("⚠️ WARNING: JWT_SECRET is missing. Using unsafe default.");
}