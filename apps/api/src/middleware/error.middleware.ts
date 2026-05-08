import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`🔥 Global Error [${req.requestId}]:`, err.stack || err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, status, err.stack);
};