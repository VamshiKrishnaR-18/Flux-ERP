import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInvoiceNumber } from '../utils/generators';
import { ProductService } from '../services/product.service';
import { CreateInvoiceSchema } from '@erp/types';
import { ClientModel } from '../models/client.model';

export const InvoiceController = {
  // ✅ FIX: Added Pagination Logic
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user?.id };

    // Run count and find in parallel for speed
    const [total, invoices] = await Promise.all([
      InvoiceModel.countDocuments(query),
      InvoiceModel.find(query)
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findOne({ _id: req.params.id, createdBy: req.user?.id }).populate('clientId');
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, data: invoice });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }
    const { clientId, items } = validation.data;
    const clientExists = await ClientModel.findById(clientId);
    if (!clientExists) { res.status(404); throw new Error("Client not found"); }

    const nextNumber = await generateInvoiceNumber(req.user?.id);
    
    const newInvoice = await InvoiceModel.create({
      ...validation.data,
      number: nextNumber,
      year: new Date().getFullYear(),
      createdBy: req.user?.id 
    });
    await ProductService.adjustStock(items, 'deduct');
    res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoice = await InvoiceModel.findOneAndUpdate(
      { _id: id, createdBy: req.user?.id },
      req.body,
      { new: true }
    );
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, message: "Invoice updated", data: invoice });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findOneAndDelete({ _id: req.params.id, createdBy: req.user?.id });
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, message: "Invoice deleted" });
  })
};