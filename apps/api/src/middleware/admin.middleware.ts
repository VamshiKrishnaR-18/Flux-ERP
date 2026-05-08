import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger';

interface UserPayload {
  id: string;
  role: string;
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as unknown as UserPayload;

  if (!user) {
    logger.warn('requireAdmin: No user object on request');
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  if (user.role !== 'admin') {
    logger.warn(`requireAdmin: Forbidden - User ${user.id} has role ${user.role}`);
    res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    return;
  }

  next();
};