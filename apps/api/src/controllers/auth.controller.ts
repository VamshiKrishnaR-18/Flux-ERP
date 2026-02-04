import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { RegisterSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/env';

const generateToken = (id: string) => {
  // ✅ FIX: Use 'jwtExpiresIn' and 'jwtSecret' (Flat structure)
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  return jwt.sign({ id }, config.jwtSecret || 'default_secret', options);
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  // ✅ FIX: Use 'nodeEnv' instead of 'env'
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
};

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Data");
    }

    const { email, password, name, role } = validation.data;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    const token = generateToken(user.id);
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error("Invalid email or password format");
    }

    const { email, password } = validation.data;
    
    // Explicitly select password for comparison
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user.id);
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
    res.json({ success: true, message: "Logged out" });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({ success: true, data: user });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    
    const user = await UserModel.findById(req.user?.id).select('+password');

    if (!user || !user.password) {
        res.status(404);
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error("Incorrect current password");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated" });
  })
};