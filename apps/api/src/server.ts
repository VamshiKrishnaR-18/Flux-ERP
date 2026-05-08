import app from './app';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './utils/logger';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('✅ MongoDB Connected');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(config.port, () => {
    
    logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
    logger.info(`📚 Swagger Docs available at http://localhost:${config.port}/api-docs`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`🛑 ${signal} received. Shutting down gracefully...`);
    
    // Set a timeout to force shutdown if it takes too long
    const forceShutdown = setTimeout(() => {
      logger.error('🔥 Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);

    server.close(async () => {
      logger.info('✅ HTTP server closed.');
      
      try {
        await mongoose.connection.close(false);
        logger.info('✅ MongoDB connection closed.');
        clearTimeout(forceShutdown);
        process.exit(0);
      } catch (err) {
        logger.error('❌ Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();