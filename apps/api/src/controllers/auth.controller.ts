import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/env';

// ✅ Helper: Send Secure Cookie
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret!,
    { expiresIn: '1d' }
  );

  const options: CookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/' // 👈 ADDED: Explicitly set path to root so Logout can find it
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
};

export const AuthController = {
  // REGISTER
  register: asyncHandler(async (req: Request, res: Response) => {
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Validation Error");
    }

    const { name, email, password } = validation.data;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    sendTokenResponse(newUser, 201, res);
  }),

  // LOGIN
  login: asyncHandler(async (req: Request, res: Response) => {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Validation Error");
    }

    const { email, password } = validation.data;
    const user = await UserModel.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    sendTokenResponse(user, 200, res);
  }),

  // ✅ LOGOUT (THE NUCLEAR OPTION)
  logout: asyncHandler(async (req: Request, res: Response) => {
    // We overwrite the cookie with an empty string and expire it immediately.
    // This is more reliable than clearCookie because it forces an update.
    res.cookie('token', '', {
      httpOnly: true,
      secure: config.nodeEnv === 'production', 
      sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      expires: new Date(0), // 💥 Set date to 1970 (immediately expired)
      path: '/'             // 💥 Match the login path exactly
    });
    
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }),

  // CHANGE PASSWORD
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; 

    if (!userId) { res.status(401); throw new Error("Unauthorized"); }

    const user = await UserModel.findById(userId);
    if (!user) { res.status(404); throw new Error("User not found"); }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) { res.status(400); throw new Error("Incorrect current password"); }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  })
};