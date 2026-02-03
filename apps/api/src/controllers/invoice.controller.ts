import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 
import { ProductService } from '../services/product.service'; 
import { generateInvoiceNumber } from '../utils/generators';
import { asyncHandler } from '../utils/asyncHandler'; // ✅ Import

export const InvoiceController = {
  
  // 1. Get All
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    await InvoiceModel.updateMany(
      { 
        status: { $in: ['pending', 'sent'] }, 
        expiredDate: { $lt: today },        
        removed: { $ne: true } 
      },
      { $set: { status: 'overdue' } }
    );

    const invoices = await InvoiceModel.find({ removed: false })
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: invoices });
  }),

  // 2. Create
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      // Throwing error triggers Global Error Handler
      res.status(400); 
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }

    const { clientId, items } = validation.data;
    
    const clientExists = await ClientModel.findById(clientId);
    if (!clientExists) {
        res.status(404);
        throw new Error("Client not found");
    }

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

  // 3. Get One
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
    if (!invoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }
    res.json({ success: true, data: invoice });
  }),

  // 4. Update
  update: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400);
        throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
      req.params.id,
      { ...validation.data },
      { new: true, runValidators: true } 
    ).populate('clientId');

    if (!updatedInvoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }
    
    res.json({ success: true, message: "Invoice updated", data: updatedInvoice });
  }),

  // 5. Delete
  delete: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }

    invoice.removed = true;
    await invoice.save();

    await ProductService.adjustStock(invoice.items, 'restore');

    res.json({ success: true, message: "Invoice deleted & Stock restored" });
  }),

  // 6. Add Payment
  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = PaymentSchema.parse(req.body); 

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }

    const currentPaid = (invoice as any).amountPaid || 0; 
    const newPaid = currentPaid + payment.amount;
    const total = invoice.total;

    let newStatus = invoice.status;
    let newPaymentStatus = 'unpaid';

    if (newPaid >= total) {
      newStatus = 'paid';
      newPaymentStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'pending';
      newPaymentStatus = 'partially';
    }

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
      id,
      {
        $inc: { amountPaid: payment.amount },
        status: newStatus,
        paymentStatus: newPaymentStatus
      },
      { new: true }
    );
    res.json({ success: true, message: "Payment recorded", data: updatedInvoice });
  }),

  // 7. Send
  send: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findByIdAndUpdate(
      req.params.id,
      { status: 'sent' },
      { new: true }
    ).populate('clientId');
    
    if (!invoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }

    const clientEmail = (invoice.clientId as any)?.email || 'No Email';
    console.log(`📧 [MOCK EMAIL] Sending Invoice #${invoice.number} to ${clientEmail}`);
    
    const publicLink = `${process.env.VITE_API_URL || 'http://localhost:3000'}/p/invoice/${invoice._id}`;
    console.log(`🔗 Public Link: ${publicLink}`);

    res.json({ 
        success: true, 
        message: "Invoice sent successfully",
        data: invoice 
    });
  }),
};