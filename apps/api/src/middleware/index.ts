import { Request, Response, NextFunction } from "express";
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

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
    return;
  }

  // FIX 1: Explicitly handle the case where split returns undefined
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Access Denied: Malformed Token" });
    return;
  }

  try {
    // FIX 2: Use 'as unknown' to tell TypeScript we trust the structure
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