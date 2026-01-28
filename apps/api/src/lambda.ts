import configure from '@vendia/serverless-express';
import app from './app';
import mongoose from 'mongoose';

// Database Connection Manager (prevents opening too many connections in Lambda)
let conn: Promise<typeof mongoose> | null = null;

const connectToDatabase = async () => {
  if (conn === null) {
    conn = mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
    }).then(() => mongoose);
    await conn;
  }
  return conn;
};

// The Lambda Handler
export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false; // Important for Mongo + Lambda
  await connectToDatabase();
  const serverlessExpress = configure({ app });
  return serverlessExpress(event, context);
};