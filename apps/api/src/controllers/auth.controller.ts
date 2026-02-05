import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { RegisterSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/env';
import { EmailService } from '../services/email.service';

const generateToken = (id: string) => {
  // ✅ FIX: Use 'jwtExpiresIn' and 'jwtSecret' (Flat structure)
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  if (!config.jwtSecret) throw new Error("JWT Secret is undefined");
  return jwt.sign({ id }, config.jwtSecret, options);
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
  }),

  // 🔑 Forgot Password
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and save to DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

    await user.save();

    // Create Reset URL
    // NOTE: In production, this should point to the FRONTEND URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await EmailService.sendPasswordReset(user.email, resetUrl);
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500);
      throw new Error("Email could not be sent");
    }
  }),

  // 🔄 Reset Password
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { resetToken } = req.params;

    if (!resetToken) {
      res.status(400);
      throw new Error("Reset token is required");
    }

    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid Token");
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password updated successfully" });
  })
};
