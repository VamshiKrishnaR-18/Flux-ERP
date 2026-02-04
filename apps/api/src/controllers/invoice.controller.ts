import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model'; // ✅ Ensure this is imported
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 
import { ProductService } from '../services/product.service'; 
import { generateInvoiceNumber } from '../utils/generators';
import { asyncHandler } from '../utils/asyncHandler';

export const InvoiceController = {
  
  // 1. Get All with Smart Search 🧠
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || ''; // 👈 Get search param
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

    // ✅ Build Query Object
    const query: any = { removed: false };

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        // 1. Direct Invoice Number Match
        query.number = searchNum;
      } else {
        // 2. Status Match?
        const statuses = ['draft', 'pending', 'sent', 'paid', 'overdue'];
        if (statuses.includes(search.toLowerCase())) {
           query.status = search.toLowerCase();
        } else {
           // 3. Client Name Search (The heavy lifting)
           // Find clients matching the name first
           const clients = await ClientModel.find({ 
               name: { $regex: search, $options: 'i' } 
           }).select('_id');
           
           const clientIds = clients.map(c => c._id);
           
           if (clientIds.length > 0) {
               query.clientId = { $in: clientIds };
           } else {
               // If not a number, not a status, and no client found -> Return nothing
               query._id = null; 
           }
        }
      }
    }

    // Fetch Data with the new query
    const invoices = await InvoiceModel.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InvoiceModel.countDocuments(query); // 👈 Count filtered docs

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

  // ... (keep the rest of the controller unchanged: create, getOne, etc.)
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
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

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
    if (!invoice) {
        res.status(404);
        throw new Error("Invoice not found");
    }
    res.json({ success: true, data: invoice });
  }),

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