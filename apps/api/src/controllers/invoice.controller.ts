import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model'; // 👈 Import this!
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 
import { ProductService } from '../services/product.service'; 
import { generateInvoiceNumber } from '../utils/generators';
import { asyncHandler } from '../utils/asyncHandler';

export const InvoiceController = {
  
  // ✅ UPDATED: GetAll with Smart Search
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || ''; 
    const skip = (page - 1) * limit;

    // Auto-overdue logic
    const today = new Date();
    await InvoiceModel.updateMany(
      { 
        status: { $in: ['pending', 'sent'] }, 
        expiredDate: { $lt: today },        
        removed: { $ne: true } 
      },
      { $set: { status: 'overdue' } }
    );

    // 🔍 Build Search Query
    const query: any = { removed: false };

    if (search) {
      const searchNum = Number(search);
      
      // 1. Search by Invoice #
      if (!isNaN(searchNum)) {
        query.number = searchNum;
      } 
      // 2. Search by Status
      else if (['draft', 'pending', 'sent', 'paid', 'overdue'].includes(search.toLowerCase())) {
        query.status = search.toLowerCase();
      } 
      // 3. Search by Client Name
      else {
        // Find clients that match the name first
        const clients = await ClientModel.find({ 
            name: { $regex: search, $options: 'i' } 
        }).select('_id');
        
        const clientIds = clients.map(c => c._id);
        
        if (clientIds.length > 0) {
            query.clientId = { $in: clientIds };
        } else {
            // If no client matches, return no results
            query._id = null; 
        }
      }
    }

    // Fetch Data
    const invoices = await InvoiceModel.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InvoiceModel.countDocuments(query);

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

  // ... (Keep existing create, getOne, update, delete, addPayment, send unchanged)
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }
    const { clientId, items } = validation.data;
    const clientExists = await ClientModel.findById(clientId);
    if (!clientExists) { res.status(404); throw new Error("Client not found"); }

    const nextNumber = await generateInvoiceNumber();
    const newInvoice = await InvoiceModel.create({
      ...validation.data,
      number: nextNumber,
      year: new Date().getFullYear(),
      createdBy: req.user?.id 
    });
    await ProductService.adjustStock(items, 'deduct');
    res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, data: invoice });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) { res.status(400); throw new Error("Invalid Input"); }
    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
      req.params.id, { ...validation.data }, { new: true, runValidators: true } 
    ).populate('clientId');
    if (!updatedInvoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, message: "Invoice updated", data: updatedInvoice });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    invoice.removed = true;
    await invoice.save();
    await ProductService.adjustStock(invoice.items, 'restore');
    res.json({ success: true, message: "Invoice deleted" });
  }),

  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = PaymentSchema.parse(req.body); 
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

    const newPaid = (invoice as any).amountPaid + payment.amount;
    let newStatus = newPaid >= invoice.total ? 'paid' : (newPaid > 0 ? 'pending' : invoice.status);
    let newPaymentStatus = newPaid >= invoice.total ? 'paid' : (newPaid > 0 ? 'partially' : 'unpaid');

    const updated = await InvoiceModel.findByIdAndUpdate(id, {
        $inc: { amountPaid: payment.amount },
        status: newStatus,
        paymentStatus: newPaymentStatus
      }, { new: true });
    res.json({ success: true, message: "Payment recorded", data: updated });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findByIdAndUpdate(req.params.id, { status: 'sent' }, { new: true }).populate('clientId');
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    console.log(`📧 Sending Invoice #${invoice.number} to ${(invoice.clientId as any)?.email}`);
    res.json({ success: true, message: "Invoice sent", data: invoice });
  }),
};