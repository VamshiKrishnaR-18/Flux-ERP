import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    // @ts-ignore - We validated mongoUri exists in env.ts
    await mongoose.connect(env.MONGO_URI, { 
        serverSelectionTimeoutMS: 5000 
    });
    logger.info("✅ Connected to MongoDB");
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};