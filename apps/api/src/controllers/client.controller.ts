import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ClientSchema } from '@erp/types';

export const ClientController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    // ✅ Pagination Logic
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const query: any = { userId: req.user?.id, removed: false };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [total, clients] = await Promise.all([
      ClientModel.countDocuments(query),
      ClientModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

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

  // ... keep create, update, delete as they are
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ClientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message);
    }
    const client = await ClientModel.create({ ...validation.data, userId: req.user?.id });
    res.status(201).json({ success: true, data: client });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const client = await ClientModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      req.body,
      { new: true }
    );
    if (!client) { res.status(404); throw new Error("Client not found"); }
    res.json({ success: true, data: client });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    // Soft delete
    const client = await ClientModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { removed: true },
      { new: true }
    );
    if (!client) { res.status(404); throw new Error("Client not found"); }
    res.json({ success: true, message: "Client deleted" });
  })
};