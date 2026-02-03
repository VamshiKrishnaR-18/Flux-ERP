import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { ClientSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler'; // ✅ Import

export const ClientController = {
  
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const clients = await ClientModel.find({ removed: { $ne: true } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  }),

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
    await ClientModel.findByIdAndUpdate(req.params.id, { removed: true });
    res.json({ success: true, message: "Client deleted successfully" });
  })
};