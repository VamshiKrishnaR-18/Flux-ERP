import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken'; // 👈 Import SignOptions Type
import { RegisterSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/env';

// ✅ Helper: Send Secure Cookie
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // 1. Generate Token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret!,
    { 
      // ✅ PROPER FIX: strictly cast to the library's expected type
      // This is safer than 'as any' because it must still be a string or number
      expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] 
    }
  );

  // 2. Calculate Cookie Expiry
  const cookieExpires = new Date(
    Date.now() + config.cookieExpiresInHours * 60 * 60 * 1000
  );

  const options: CookieOptions = {
    expires: cookieExpires,
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/' 
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token 
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

  // LOGOUT
  logout: asyncHandler(async (req: Request, res: Response) => {
    res.cookie('token', '', {
      httpOnly: true,
      secure: config.nodeEnv === 'production', 
      sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      expires: new Date(0), 
      path: '/'             
    });

    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
    
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