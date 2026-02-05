import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from '../config/env';

interface TokenPayload {
  id: string;
  role: string;
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  let token;

  // 1. Check Header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2. Check Cookie (New Secure Way)
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Access Denied: No Token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid Token" });
  }
};