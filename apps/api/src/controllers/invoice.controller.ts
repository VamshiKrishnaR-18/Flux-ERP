import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 
import { ProductService } from '../services/product.service'; // ✅ Using Service
import { generateInvoiceNumber } from '../utils/generators';   // ✅ Using Utility

export const InvoiceController = {
  
  // 1. Get All (with Auto-Overdue Check)
  getAll: async (req: Request, res: Response) => {
    try {
      // Auto-update overdue status
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
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  },

  // 2. Create (Clean & Stock Integrated)
  create: async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: validation.error.errors });

    try {
      const { clientId, items } = validation.data;
      
      const clientExists = await ClientModel.findById(clientId);
      if (!clientExists) return res.status(404).json({ success: false, message: "Client not found" });

      // ✅ Utility Function
      const nextNumber = await generateInvoiceNumber();
      
      const newInvoice = await InvoiceModel.create({
        ...validation.data,
        number: nextNumber,
        year: new Date().getFullYear(),
        createdBy: req.user?.id 
      });

      // ✅ Service Layer (One line handling stock logic)
      await ProductService.adjustStock(items, 'deduct');

      res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });
    } catch (error) {
      console.error("Create Invoice Error:", error);
      res.status(500).json({ success: false, message: "Failed to create invoice" });
    }
  },

  // 3. Get Single
  getOne: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching invoice" });
    }
  },

  // 4. Update
  update: async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: validation.error.errors });

    try {
      const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        req.params.id,
        { ...validation.data },
        { new: true, runValidators: true } 
      ).populate('clientId');

      if (!updatedInvoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      
      // NOTE: For a full-featured app, you might want to adjust stock diffs here too, 
      // but for this MVP, we only adjust on Create/Delete.
      
      res.json({ success: true, message: "Invoice updated", data: updatedInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update invoice" });
    }
  },

  // 5. Delete (Soft Delete + Stock Restore)
  delete: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

      invoice.removed = true;
      await invoice.save();

      // ✅ Service Layer (Restore stock automatically)
      await ProductService.adjustStock(invoice.items, 'restore');

      res.json({ success: true, message: "Invoice deleted & Stock restored" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete invoice" });
    }
  },

  // 6. Add Payment
  addPayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payment = PaymentSchema.parse(req.body); 

      const invoice = await InvoiceModel.findById(id);
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

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
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to record payment" });
    }
  },

  // 7. Send (Mock Email)
  send: async (req: Request, res: Response) => {
    try {
      // Direct update to bypass strict validation on old records
      const invoice = await InvoiceModel.findByIdAndUpdate(
        req.params.id,
        { status: 'sent' },
        { new: true }
      ).populate('clientId');
      
      if (!invoice) {
          return res.status(404).json({ success: false, message: "Invoice not found" });
      }

      // Log Mock Email
      const clientEmail = (invoice.clientId as any)?.email || 'No Email';
      console.log(`📧 [MOCK EMAIL] Sending Invoice #${invoice.number} to ${clientEmail}`);
      
      const publicLink = `${process.env.VITE_API_URL || 'http://localhost:3000'}/p/invoice/${invoice._id}`;
      console.log(`🔗 Public Link: ${publicLink}`);

      res.json({ 
          success: true, 
          message: "Invoice sent successfully",
          data: invoice 
      });

    } catch (error) {
      console.error("❌ Send Error:", error); 
      res.status(500).json({ success: false, message: "Failed to send invoice" });
    }
  },
};