import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';

export const requestIdMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  
  // Attach to request object
  req.requestId = requestId;
  
  // Attach to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
