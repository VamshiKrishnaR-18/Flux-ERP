import configure from '@vendia/serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';
import app from './app';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './utils/logger';

// 1. CACHING VARIABLES
let cachedServer: any;
let conn: Promise<typeof mongoose> | null = null;

const connectToDatabase = async () => {
  if (conn === null) {
    logger.info('Initializing new Database Connection...');
    
    conn = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then(() => mongoose);
    await conn;
  }
  return conn;
};

// 2. THE HANDLER
export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

    
    if (!cachedServer) {
      logger.info('Initializing Serverless Express...');
      cachedServer = configure({ app });
    }

    
    return cachedServer(event, context, callback);
  } catch (error) {
    logger.error('Lambda Execution Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};


export const cronHandler = async () => {
  try {
    await connectToDatabase();
    
    const { checkOverdueInvoices } = await import('./jobs/cron.js');
    await checkOverdueInvoices();
    return { statusCode: 200, body: 'Cron executed successfully' };
  } catch (error) {
    logger.error('Cron Handler Error:', error);
    return { statusCode: 500, body: 'Cron failed' };
  }
};
