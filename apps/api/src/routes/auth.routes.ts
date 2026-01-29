import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSchema, LoginSchema } from '@erp/types';
import { UserModel } from '../models/user.model';

const router = Router();


router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const validation = UserSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  const { name, email, password } = validation.data;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: "User with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const validation = LoginSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  const { email, password } = validation.data;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;