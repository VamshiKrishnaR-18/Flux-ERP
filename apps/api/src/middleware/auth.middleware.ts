import { Request, Response, NextFunction, RequestHandler } from "express";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { config } from '../config/env';
import { logger } from '../utils/logger';

const clerkClient = createClerkClient({ secretKey: config.clerkSecretKey });

export const authMiddleware: RequestHandler = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.__session) {
    token = req.cookies.__session;
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Access Denied: No Token" });
    return;
  }

  try {
    const sessionClaims = await clerkClient.verifyToken(token);
    
    req.user = {
      id: sessionClaims.sub,
      role: (sessionClaims as any).role || 'user',
      email: (sessionClaims as any).email,
    };
    
    next();
  } catch (error: any) {
    logger.error('Authentication Error:', {
      message: error.message,
      code: error.code
    });
    res.status(403).json({ 
      success: false, 
      message: "Invalid Token"
    });
  }
};
