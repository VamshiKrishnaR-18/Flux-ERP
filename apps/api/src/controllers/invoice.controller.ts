import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
// 1. UPDATE IMPORTS 📦
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 


// HELPER: Generate next invoice number
const generateInvoiceNumber = async () => {
  const lastInvoice = await InvoiceModel.findOne().sort({ number: -1 });
  const lastNumber = lastInvoice?.number ?? 1000;

  return lastNumber + 1;
};


export const InvoiceController = {
  
  // 1. GET ALL (With Auto-Overdue Check) 🤖
  getAll: async (req: Request, res: Response) => {
    try {
      // ✅ AUTOMATION: Check for expired invoices
      const today = new Date();
      
      // If status is pending/sent AND date is past due -> Flip to 'overdue'
      await InvoiceModel.updateMany(
        { 
          status: { $in: ['pending', 'sent'] }, 
          expiredDate: { $lt: today },         
          removed: { $ne: true } 
        },
        { 
          $set: { status: 'overdue' }          
        }
      );

      // Now fetch the updated list
      const invoices = await InvoiceModel.find({removed: false})
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 });
        
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  },

  // CREATE
  create: async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const { clientId } = validation.data;

      const clientExists = await ClientModel.findById(clientId);
      if (!clientExists) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }

      const nextNumber = await generateInvoiceNumber();

      const newInvoice = await InvoiceModel.create({
        ...validation.data,
        number: nextNumber,
        year: new Date().getFullYear(),
        createdBy: req.user?.id 
      });

      res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to create invoice" });
    }
  },

  // GET ONE
  getOne: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching invoice" });
    }
  },

  // UPDATE
  update: async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        req.params.id,
        { 
          ...validation.data,
          subTotal: validation.data.subTotal,
          taxTotal: validation.data.taxTotal,
          total: validation.data.total
        },
        { new: true, runValidators: true } 
      ).populate('clientId');

      if (!updatedInvoice) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
      }

      res.json({ success: true, message: "Invoice updated", data: updatedInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update invoice" });
    }
  },

  // DELETE
  delete: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findByIdAndUpdate(
        req.params.id, 
        { removed: true }, 
        { new: true }
      );
      
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete invoice" });
    }
  },

  // 2. NEW: ADD PAYMENT (Auto-Paid Logic) 💰
  addPayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payment = PaymentSchema.parse(req.body); // Validation

      const invoice = await InvoiceModel.findById(id);
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

      // Calculate Math
      // Note: We cast to 'any' because strict TS might not see 'amountPaid' immediately on the Document type
      const currentPaid = (invoice as any).amountPaid || 0; 
      const newPaid = currentPaid + payment.amount;
      const total = invoice.total;

      // Determine Status
      let newStatus = invoice.status;
      let newPaymentStatus = 'unpaid';

      if (newPaid >= total) {
        newStatus = 'paid';
        newPaymentStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'pending';
        newPaymentStatus = 'partially';
      }

      // Update Database
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
      console.error(error);
      res.status(400).json({ success: false, message: "Failed to record payment" });
    }
  }
};