import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    logger.info("NODE_ENV:", config.nodeEnv);
    logger.info("Mongo URI exists:", !!config.mongoUri);
    logger.info(
      "Mongo URI:",
      config.mongoUri.replace(/\/\/.*@/, "//****:****@")
    );
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info("✅ Connected to MongoDB");
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed:", {
    error,
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });
    throw error;
  }
};
