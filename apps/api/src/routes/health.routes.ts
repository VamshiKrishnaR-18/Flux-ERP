import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the API and its dependencies (like MongoDB)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *       503:
 *         description: API is unhealthy
 */
router.get('/', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  
  const healthData = {
    status: 'up',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbStatus,
    version: process.env.npm_package_version || '1.0.0',
  };

  if (dbStatus === 'down') {
    return errorResponse(res, 'Service Unhealthy', 503, healthData);
  }

  return successResponse(res, healthData, 'Service Healthy');
});

export default router;
