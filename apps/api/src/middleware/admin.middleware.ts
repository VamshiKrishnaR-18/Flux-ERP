import { Request, Response, NextFunction, RequestHandler } from 'express';

interface UserPayload {
  id: string;
  role: string;
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as unknown as UserPayload;

  if (!user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    return;
  }

  next();
};