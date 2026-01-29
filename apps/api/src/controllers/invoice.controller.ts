import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
// 1. IMPORT FROM SHARED PACKAGE 📦
import { CreateInvoiceSchema } from '@erp/types'; 


// HELPER: Generate next invoice number
const generateInvoiceNumber = async () => {
  const lastInvoice = await InvoiceModel.findOne().sort({ number: -1 });
  const lastNumber = lastInvoice?.number ?? 1000;

  return lastNumber + 1;
};


export const InvoiceController = {
  // GET ALL
  getAll: async (req: Request, res: Response) => {
    try {
      const invoices = await InvoiceModel.find({removed: false})
        .populate('clientId', 'name email') // Join Client data
        .sort({ createdAt: -1 });
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  },

  // CREATE
  create: async (req: Request, res: Response) => {
    // 2. USE SHARED VALIDATION 🛡️
    const validation = CreateInvoiceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors });
    }

    try {
      const { clientId } = validation.data;

      // Check if Client Exists
      const clientExists = await ClientModel.findById(clientId);
      if (!clientExists) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }

      // Auto-Generate Number
      const nextNumber = await generateInvoiceNumber();

      // Create Invoice
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
          // Ensure these are explicitly saved
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
  }, // <--- ✅ FIX: ADDED COMMA HERE

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
  }
};
  