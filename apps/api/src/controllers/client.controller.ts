import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ClientSchema } from '@erp/types';
import { buildCsv } from '../utils/csv';
import crypto from 'crypto';

export const ClientController = {
  // ✅ FIX: Added Pagination & Server-Side Search
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    // Base query: Only my clients, not deleted ones
    const query: any = { userId: req.user?.id, removed: false };

    // Add Search Logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute queries in parallel for performance
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

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const search = (req.query.search as string) || '';

    const query: any = { userId, removed: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const clients: any[] = await ClientModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const csv = buildCsv(clients, [
      { header: 'Name', value: (c: any) => c.name ?? '' },
      { header: 'Email', value: (c: any) => c.email ?? '' },
      { header: 'Phone', value: (c: any) => c.phoneNumber ?? '' },
      { header: 'Address', value: (c: any) => c.address ?? '' },
      { header: 'Status', value: (c: any) => c.status ?? '' },
      { header: 'Created At', value: (c: any) => (c.createdAt ? new Date(c.createdAt).toISOString() : '') },
      { header: 'Client ID', value: (c: any) => c._id ?? '' }
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="clients-${dateTag}.csv"`);
    res.status(200).send(csv);
  }),

  // 🔗 Create or return an existing portal token for a client
  // POST /clients/:id/portal-token?rotate=true
  portalToken: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const rotate = String(req.query.rotate ?? '').toLowerCase() === 'true';

    const client: any = await ClientModel.findOne({
      _id: req.params.id,
      userId,
      removed: false
    });
    
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // If rotate=true OR no token exists, generate new one
    if (rotate || !client.portalToken) {
        // Generate a random 32-char hex string
        client.portalToken = crypto.randomBytes(16).toString('hex');
        await client.save();
    }

    res.json({
        success: true,
        message: rotate ? "New portal link generated" : "Portal link retrieved",
        data: {
            token: client.portalToken,
            url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/portal/${client.portalToken}`
        }
    });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const client = await ClientModel.findOne({ _id: req.params.id, userId: req.user?.id, removed: false });
    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }
    res.json({ success: true, data: client });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = ClientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Data");
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
    // ✅ Soft Delete implementation
    const client = await ClientModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { removed: true },
      { new: true }
    );
    if (!client) { res.status(404); throw new Error("Client not found"); }
    res.json({ success: true, message: "Client deleted" });
  })
};