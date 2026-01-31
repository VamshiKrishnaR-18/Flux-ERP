import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { CreateInvoiceSchema, PaymentSchema } from '@erp/types'; 
import { EmailService } from '../services/email.service';

const generateInvoiceNumber = async () => {
  const lastInvoice = await InvoiceModel.findOne().sort({ number: -1 });
  const lastNumber = lastInvoice?.number ?? 1000;
  return lastNumber + 1;
};

export const InvoiceController = {
  
  // 1. GET ALL (With Auto-Overdue Logic)
  getAll: async (req: Request, res: Response) => {
    try {
      // 🤖 AUTOMATION: Flip expired invoices to 'overdue' on load
      const today = new Date();
      await InvoiceModel.updateMany(
        { 
          status: { $in: ['pending', 'sent'] }, 
          expiredDate: { $lt: today },         
          removed: { $ne: true } 
        },
        { $set: { status: 'overdue' } }
      );

      const invoices = await InvoiceModel.find({removed: false})
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 });
        
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  },

  create: async (req: Request, res: Response) => {
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, error: validation.error.errors });

    try {
      const { clientId } = validation.data;
      const clientExists = await ClientModel.findById(clientId);
      if (!clientExists) return res.status(404).json({ success: false, message: "Client not found" });

      const nextNumber = await generateInvoiceNumber();
      const newInvoice = await InvoiceModel.create({
        ...validation.data,
        number: nextNumber,
        year: new Date().getFullYear(),
        createdBy: req.user?.id 
      });
      res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create invoice" });
    }
  },

  getOne: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching invoice" });
    }
  },

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
      res.json({ success: true, message: "Invoice updated", data: updatedInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update invoice" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const invoice = await InvoiceModel.findByIdAndUpdate(req.params.id, { removed: true }, { new: true });
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete invoice" });
    }
  },

  // 💰 ADD PAYMENT (With Logic)
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
  }, // ✅ COMMA ADDED HERE

  // 🚀 ONE-CLICK SEND
  send: async (req: Request, res: Response) => {
    try {
      // Populate Client to get email address
      const invoice = await InvoiceModel.findById(req.params.id).populate('clientId');
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

      if (invoice.status !== 'draft') {
        return res.status(400).json({ success: false, message: "Invoice is already sent or paid" });
      }

      // ✅ 1. Send Email
      const client = invoice.clientId as any;
      if (client && client.email) {
        await EmailService.sendInvoice(invoice, client);
      }

      // ✅ 2. Update Status
      invoice.status = 'sent';
      await invoice.save();

      res.json({ success: true, message: "Invoice sent successfully", data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to send invoice" });
    }
  },
};