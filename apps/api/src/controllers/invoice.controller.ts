import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInvoiceNumber } from '../utils/generators';
import { ProductService } from '../services/product.service';
import { CreateInvoiceSchema } from '@erp/types';
import { ClientModel } from '../models/client.model';
import { EmailService } from '../services/email.service';

export const InvoiceController = {
  
  // --- EXISTING METHODS ---

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user?.id };

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
    
    // Validate Client
    const clientExists = await ClientModel.findById(clientId);
    if (!clientExists) { res.status(404); throw new Error("Client not found"); }

    const nextNumber = await generateInvoiceNumber(req.user?.id);
    
    const newInvoice = await InvoiceModel.create({
      ...validation.data,
      number: nextNumber,
      year: new Date().getFullYear(),
      createdBy: req.user?.id 
    });

    // Adjust Stock
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
  }),

  // --- 🛠️ NEW METHODS (Fixed Types) ---

  // ✅ FIX: Use 'partially' instead of 'partially_paid'
  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    
    const invoice = await InvoiceModel.findOne({ _id: id, createdBy: req.user?.id });
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

    const newPaid = (invoice.amountPaid || 0) + Number(amount);
    
    // ✅ Logic: "paid" if full amount, otherwise "partially"
    // The previous error was using "partially_paid" which is invalid in your Schema
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partially';

    invoice.amountPaid = newPaid;
    invoice.paymentStatus = newStatus; // Typescript error resolved here
    if (newStatus === 'paid') {
        invoice.status = 'paid';
    }
    
    await invoice.save();
    res.json({ success: true, message: "Payment recorded", data: invoice });
  }),

  // 📧 Send Invoice Email
  send: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findOne({ _id: req.params.id, createdBy: req.user?.id }).populate('clientId');
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

    const client = invoice.clientId as any; // Populated
    if (!client || !client.email) {
      res.status(400);
      throw new Error("Client email not found");
    }

    const sent = await EmailService.sendInvoice(invoice, client);
    if (!sent) {
      res.status(500);
      throw new Error("Failed to send email");
    }

    // Update status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    res.json({ success: true, message: "Invoice sent successfully" });
  })
};