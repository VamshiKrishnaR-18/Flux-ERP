import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { ClientSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler';

export const ClientController = {
  
  // ✅ UPDATED: Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || ''; // 👈 Get Search Term
    const skip = (page - 1) * limit;

    // Build Query
    const query: any = { removed: { $ne: true } };

    if (search) {
      // Search in Name OR Email (Case-insensitive)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await ClientModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ClientModel.countDocuments(query); // 👈 Count filtered docs

    res.json({ 
      success: true, 
      data: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }),

  // ... (Keep create, update, delete unchanged)
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ClientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }
    const newClient = await ClientModel.create(validation.data);
    res.status(201).json({ success: true, data: newClient });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const updatedClient = await ClientModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      res.status(404);
      throw new Error("Client not found");
    }
    res.json({ success: true, data: updatedClient });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    // Soft Delete
    await ClientModel.findByIdAndUpdate(req.params.id, { removed: true });
    res.json({ success: true, message: "Client deleted successfully" });
  })
};