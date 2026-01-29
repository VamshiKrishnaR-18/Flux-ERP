import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs'; // <--- Security Tool
import { ClientSchema, ClientType, UserSchema, UserType } from '@erp/types';
import { ClientModel } from './models/Client';
import { UserModel } from './models/User';
import jwt from 'jsonwebtoken';
import { LoginSchema } from '@erp/types';

const app = express();

app.use(helmet());
// FIX: Allow the Frontend to talk to us
app.use(cors({
  origin: "http://localhost:5174",
  credentials: true
}));
app.use(express.json());

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Flux ERP API is Online", timestamp: new Date().toISOString() });
});


// AUTHENTICATION ENDPOINTS

// 1. REGISTER USER
app.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  // A. Validate Input
  const validation = UserSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  const { name, email, password } = validation.data;

  try {
    // B. Check if User Exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: "User with this email already exists" });
      return;
    }

    // C. Hash the Password (The Security Step)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // D. Save to DB
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword, // <--- NEVER save plain text
      role: 'user'
    });

    console.log("✅ User Registered:", newUser.email);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// 2. LOGIN USER
app.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  // A. Validate Input
  const validation = LoginSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  const { email, password } = validation.data;

  try {
    // B. Find User
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" }); // Generic error for security
      return;
    }

    // C. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // D. Issue Token (The "Security Badge")
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || "fallback-secret-key", // In prod, use .env!
      { expiresIn: "1d" }
    );

    console.log("🔑 Login Successful:", user.email);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // <--- The Key to the Kingdom
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


// CLIENT ENDPOINTS

app.post('/clients', async (req: Request, res: Response): Promise<void> => {
  const validation = ClientSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ success: false, error: "Validation Failed", details: validation.error.errors });
    return;
  }

  try {
    const existingClient = await ClientModel.findOne({ email: validation.data.email });
    if (existingClient) {
      res.status(409).json({ success: false, message: "Client with this email already exists" });
      return;
    }

    const newClient = await ClientModel.create(validation.data);
    res.status(201).json({ success: true, message: "Client created successfully", data: newClient });

  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default app;