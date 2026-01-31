import dotenv from 'dotenv';
dotenv.config(); // Load .env file before anything else

import app from './app';
import mongoose from 'mongoose';

import { startCronJobs } from './jobs/cron';

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("❌ MONGO_URI is missing in .env file");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    startCronJobs();

    app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();