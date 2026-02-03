import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    // @ts-ignore - We validated mongoUri exists in env.ts
    await mongoose.connect(config.mongoUri, { 
        serverSelectionTimeoutMS: 5000 
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};