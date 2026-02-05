import { env } from './config/env'; // ✅ Load Config FIRST
import app from './app';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { startCronJobs } from './jobs/cron';
import { logger } from './utils/logger';

const startServer = async () => {
  // 1. Connect DB
  await connectDB();
  
  // 2. Start Jobs
  startCronJobs();

  // 3. Start Listener
  const server = app.listen(config.port, () => {
    logger.info(`⚡️[server]: Server is running at http://localhost:${config.port}`);
  });

  // ✅ Graceful Shutdown Logic
  const shutdown = async () => {
    logger.info('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');
    
    // Stop accepting new requests
    server.close(() => {
      logger.info('✅ HTTP server closed.');
      
      // Close Database Connection
      mongoose.connection.close(false).then(() => {
        logger.info('✅ MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  // Listen for kill signals (Ctrl+C, Docker stop, Deployment)
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();