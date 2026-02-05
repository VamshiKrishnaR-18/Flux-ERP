import app from './app';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './utils/logger';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(config.port, () => {
    // ✅ FIX: Changed 'config.env' to 'config.nodeEnv'
    logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
    logger.info(`📚 Swagger Docs available at http://localhost:${config.port}/api-docs`);
  });

  // GRACEFUL SHUTDOWN
  const shutdown = async () => {
    logger.info('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false).then(() => {
        logger.info('✅ MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();