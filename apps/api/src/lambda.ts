console.log('LAMBDA_LOAD: Starting to load lambda.ts');

import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';
import mongoose from 'mongoose';
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

console.log('LAMBDA_LOAD: Finished loading imports');

// 1. CACHING VARIABLES
let cachedServer: any;
let conn: Promise<typeof mongoose> | null = null;

// Catch unhandled rejections/exceptions for better CloudWatch logs
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const connectToDatabase = async () => {
  if (conn === null) {
    if (!config.mongoUri || config.mongoUri === '') {
      logger.error('CRITICAL: MONGO_URI is not defined in environment variables.');
      throw new Error('Database configuration missing');
    }

    logger.info('Initializing new Database Connection...');
    
    conn = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then(() => {
      logger.info('✅ MongoDB Connected successfully in Lambda');
      return mongoose;
    });
    await conn;
  }
  return conn;
};

// 2. THE HANDLER
export const handler: APIGatewayProxyHandler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Log minimal event info for debugging in CloudWatch
  const method = event.httpMethod || (event as any).method || 'UNKNOWN';
  const path = event.path || (event as any).url || 'UNKNOWN';
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  
  console.log(`Lambda Event: ${method} ${path} [RequestId: ${requestId}]`);

  try {
    // 1. Ensure Database Connection
    try {
      await connectToDatabase();
    } catch (dbError: any) {
      logger.error('Database Connection Error in Handler:', dbError.message);
      return {
        statusCode: 503,
        body: JSON.stringify({ 
          success: false, 
          message: 'Service Unavailable: Database connection failed'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 2. Initialize Serverless Express if not cached
    if (!cachedServer) {
      logger.info('Initializing Serverless Express...');
      cachedServer = serverlessExpress({ app });
    }

    // 3. Proxy the request
    return await cachedServer(event, context);
  } catch (error: any) {
    logger.error('Lambda Execution Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal Server Error',
        error: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};


export const cronHandler = async () => {
  try {
    await connectToDatabase();
    
    const { checkOverdueInvoices } = await import('./jobs/cron.js');
    await checkOverdueInvoices();
    return { statusCode: 200, body: 'Cron executed successfully' };
  } catch (error: any) {
    logger.error('Cron Handler Error:', error);
    return { statusCode: 500, body: `Cron failed: ${error.message}` };
  }
};
