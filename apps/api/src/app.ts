import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ClientSchema, ClientType } from '@erp/types'; 
import { ClientModel } from './models/Client';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "NexaSuite API is Online", timestamp: new Date().toISOString() });
});

// CREATE CLIENT ENDPOINT
// FIX 1: Added 'async' keyword here so we can use 'await'
app.post('/clients', async (req: Request, res: Response): Promise<void> => {
  // 1. Validate the Input using Zod
  const validation = ClientSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ 
      success: false, 
      error: "Validation Failed", 
      details: validation.error.errors 
    });
    return;
  }

  // 2. Business Logic: Check duplicates
  try {
    const existingClient = await ClientModel.findOne({ email: validation.data.email });
    
    if (existingClient) {
      res.status(409).json({
        success: false,
        message: "Client with this email already exists",
      });
      return;
    }

    // FIX 2: Actually save the data to MongoDB!
    const newClient = await ClientModel.create(validation.data);

    console.log("✅ Client Saved:", newClient.id);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient
    });

  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default app;