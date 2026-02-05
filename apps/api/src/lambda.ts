import configure from '@vendia/serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';
import app from './app';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './utils/logger';

// 1. CACHING VARIABLES (Outside the handler)
// We store the server and db connection here so they survive between requests
let cachedServer: any;
let conn: Promise<typeof mongoose> | null = null;

const connectToDatabase = async () => {
  if (conn === null) {
    logger.info('Initializing new Database Connection...');
    // @ts-ignore
    conn = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then(() => mongoose);
    await conn;
  }
  return conn;
};

// 2. THE HANDLER
export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
  // Critical: Tells Lambda "Don't wait for the DB connection to close, just return the response"
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

    // 3. PERFORMANCE FIX: Only initialize Express if we haven't already
    if (!cachedServer) {
      logger.info('Initializing Serverless Express...');
      cachedServer = configure({ app });
    }

    // 4. Return the cached server
    return cachedServer(event, context, callback);
  } catch (error) {
    logger.error('Lambda Execution Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

// Optional: Separate handler for Cron Jobs (Triggered by EventBridge)
export const cronHandler = async () => {
  try {
    await connectToDatabase();
    // Dynamically import to avoid circular deps or unnecessary loads
    // @ts-ignore
    const { checkOverdueInvoices } = await import('./jobs/cron.js');
    await checkOverdueInvoices();
    return { statusCode: 200, body: 'Cron executed successfully' };
  } catch (error) {
    logger.error('Cron Handler Error:', error);
    return { statusCode: 500, body: 'Cron failed' };
  }
};
