import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { CreateInvoiceSchema, UpdateInvoiceSchema } from '../validators/invoice.validator'; // <--- Importing from new folder
import { ClientModel } from '../models/client.model';

// HELPER: Generate next invoice number
const generateInvoiceNumber = async () => {
  const lastInvoice = await InvoiceModel.findOne().sort({ number: -1 });
  return lastInvoice ? lastInvoice.number + 1 : 1001; // Start at 1001
};

export const InvoiceController = {
  // GET ALL
  getAll: async (req: Request, res: Response) => {
    try {
      const invoices = await InvoiceModel.find()
        .populate('clientId', 'name email') // Join Client data
        .sort({ createdAt: -1 });
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  },

  // CREATE
  create: async (req: Request, res: Response) => {
    // 1. Validate Input
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const { clientId } = validation.data;

      // 2. Check if Client Exists
      const clientExists = await ClientModel.findById(clientId);
      if (!clientExists) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }

      // 3. Auto-Generate Number if not provided (or overwrite it for safety)
      const nextNumber = await generateInvoiceNumber();

      // 4. Create Invoice
      const newInvoice = await InvoiceModel.create({
        ...validation.data,
        number: nextNumber,
        year: new Date().getFullYear(), // Force current year
        createdBy: req.user?.id // From Auth Middleware
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

  // DELETE (Soft Delete)
  delete: async (req: Request, res: Response) => {
    try {
      // We don't actually delete invoices (audit trail), we just mark them removed
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
  }
};