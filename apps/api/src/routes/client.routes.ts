import { Router, Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { ClientSchema } from '@erp/types';
import { authMiddleware } from '../middleware/index';

const router = Router();

// GET ALL CLIENTS
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clients = await ClientModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch clients" });
  }
});

// CREATE CLIENT
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// UPDATE CLIENT (New)
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // { new: true } returns the updated document instead of the old one
    const updatedClient = await ClientModel.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.json({ success: true, message: "Client updated", data: updatedClient });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update client" });
  }
});

// DELETE CLIENT (New)
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedClient = await ClientModel.findByIdAndDelete(id);

    if (!deletedClient) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete client" });
  }
});

export default router;