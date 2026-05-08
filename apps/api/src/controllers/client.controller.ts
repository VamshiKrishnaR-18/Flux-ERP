import { Request, Response } from 'express';
import { ClientModel } from '../models/client.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ClientSchema } from '@erp/types';
import { buildCsv } from '../utils/csv';
import { logActivity } from '../utils/activity';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { successResponse } from '../utils/response';
import { sanitize } from '../utils/sanitize';

export const ClientController = {
  // Pagination & Server-Side Search
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    
    const query: any = { userId: req.user?.id, removed: false };

    // Add Search Logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    
    const [total, clients] = await Promise.all([
      ClientModel.countDocuments(query),
      ClientModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return successResponse(res, clients, "Clients retrieved", 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
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

    
    if (rotate || !client.portalToken) {
        
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
    const sanitizedData = sanitize(validation.data);
    const client = await ClientModel.create({ ...sanitizedData, userId: req.user?.id });
    
    await logActivity({
        userId: String(req.user?.id),
        action: 'created',
        resourceType: 'Client',
        resourceId: String(client._id),
        resourceName: client.name,
        after: client.toObject()
    });

    res.status(201).json({ success: true, data: client });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const existing = await ClientModel.findOne({ _id: req.params.id, userId, removed: false });
    if (!existing) { res.status(404); throw new Error("Client not found"); }

    const sanitizedBody = sanitize(req.body || {});
    const client = await ClientModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      sanitizedBody,
      { new: true }
    );
    if (!client) { res.status(404); throw new Error("Client not found"); }

    await logActivity({
        userId: String(req.user?.id),
        action: 'updated',
        resourceType: 'Client',
        resourceId: String(client._id),
        resourceName: client.name,
        details: Object.keys(req.body),
        before: existing.toObject(),
        after: client.toObject()
    });

    res.json({ success: true, data: client });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    
    const client = await ClientModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { removed: true },
      { new: true }
    );
    if (!client) { res.status(404); throw new Error("Client not found"); }
    res.json({ success: true, message: "Client deleted" });
  }),

  bulkImport: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) { res.status(400); throw new Error("No file uploaded"); }
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error("Unauthorized"); }

    const content = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const clientsToCreate = records.map((r: any) => ({
        userId,
        name: r.name || r.Name,
        email: r.email || r.Email,
        phoneNumber: r.phone || r.Phone || r.phoneNumber,
        address: r.address || r.Address,
        status: 'active'
    })).filter((c: any) => c.name && c.email);

    const result = await ClientModel.insertMany(clientsToCreate);

    await logActivity({
        userId: String(userId),
        action: 'created',
        resourceType: 'Client',
        resourceId: 'bulk',
        resourceName: `Bulk Import (${result.length} clients)`
    });

    res.json({ success: true, message: `Imported ${result.length} clients` });
  })
};