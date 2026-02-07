import { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { RegisterSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/env';
import { EmailService } from '../services/email.service';

const generateToken = (id: string, role: string) => {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  if (!config.jwtSecret) throw new Error("JWT Secret is undefined");
  return jwt.sign({ id, role }, config.jwtSecret, options);
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 24 * 60 * 60 * 1000
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

    const token = generateToken(user.id, user.role);
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
    
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user.id, user.role);
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

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;
    const userId = req.user?.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error("Email already in use");
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
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

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password updated successfully" });
  })
};