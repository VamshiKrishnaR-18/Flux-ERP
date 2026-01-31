import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ✅ FIX: Explicitly type as 'RequestHandler' to satisfy app.use()
export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Access Denied: Malformed Token" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "fallback-secret-key"
    ) as unknown as TokenPayload;

    req.user = decoded;
    next();

  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid or Expired Token" });
  }
};