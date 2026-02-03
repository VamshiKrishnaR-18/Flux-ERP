import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include 'user'
export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    // Make sure JWT_SECRET matches your .env file
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    const verified = jwt.verify(token, secret);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid Token' });
  }
};