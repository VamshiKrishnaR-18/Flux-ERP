import configure from '@vendia/serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';
import app from './app';
import mongoose from 'mongoose';

// 1. CACHING VARIABLES (Outside the handler)
// We store the server and db connection here so they survive between requests
let cachedServer: any;
let conn: Promise<typeof mongoose> | null = null;

const connectToDatabase = async () => {
  if (conn === null) {
    console.log('Initializing new Database Connection...');
    conn = mongoose.connect(process.env.MONGO_URI!, {
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

  await connectToDatabase();

  // 3. PERFORMANCE FIX: Only initialize Express if we haven't already
  if (!cachedServer) {
    console.log('Initializing Serverless Express...');
    cachedServer = configure({ app });
  }

  // 4. Return the cached server
  return cachedServer(event, context, callback);
};