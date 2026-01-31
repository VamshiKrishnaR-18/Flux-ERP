import { Request, Response } from 'express';
import { QuoteModel } from '../models/quote.model';
import { InvoiceModel } from '../models/invoice.model';

import { EmailService } from '../services/email.service';

// ✅ FIX: Cast to 'any' to avoid TS error
const generateQuoteNumber = async () => {
  const last = await QuoteModel.findOne().sort({ number: -1 });
  return ((last as any)?.number ?? 1000) + 1;
};

// ✅ FIX: Cast to 'any' here too just in case
const generateInvoiceNumber = async () => {
  const last = await InvoiceModel.findOne().sort({ number: -1 });
  return ((last as any)?.number ?? 1000) + 1;
};

export const QuoteController = {
  // GET ALL
  getAll: async (req: Request, res: Response) => {
    try {
      const quotes = await QuoteModel.find().populate('clientId').sort({ createdAt: -1 });
      res.json({ success: true, data: quotes });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch quotes" });
    }
  },

  // CREATE
  create: async (req: Request, res: Response) => {
    try {
      const nextNumber = await generateQuoteNumber();
      const newQuote = await QuoteModel.create({
        ...req.body,
        number: nextNumber,
        createdBy: req.user?.id
      });
      res.status(201).json({ success: true, data: newQuote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create quote" });
    }
  },

  // CONVERT TO INVOICE
  convertToInvoice: async (req: Request, res: Response) => {
    try {
      const quote = await QuoteModel.findById(req.params.id);
      if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

      if (quote.status === 'converted') {
        return res.status(400).json({ success: false, message: "Already converted" });
      }

      // 1. Create Invoice from Quote Data
      const nextInvNumber = await generateInvoiceNumber();
      
      // We need to treat quote as 'any' or explicitly type it to access properties 
      // if the model wasn't strictly typed.
      const quoteData = quote as any; 

      const newInvoice = await InvoiceModel.create({
        number: nextInvNumber,
        year: new Date().getFullYear(),
        date: new Date(),
        expiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        clientId: quoteData.clientId,
        items: quoteData.items,
        subTotal: quoteData.subTotal,
        taxRate: quoteData.taxRate,
        taxTotal: quoteData.taxTotal,
        total: quoteData.total,
        discount: quoteData.discount,
        notes: `Converted from Quote #${quoteData.number}`,
        status: 'draft',
        
        // Link back
        converted: { from: 'quote', quoteId: quote._id }
      });

      // 2. Update Quote Status
      quote.status = 'converted';
      quote.convertedInvoiceId = newInvoice._id as any;
      await quote.save();

      res.json({ success: true, message: "Converted to Invoice", data: newInvoice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Conversion failed" });
    }
  },
  
  // DELETE
  delete: async (req: Request, res: Response) => {
    try {
      await QuoteModel.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Quote deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete" });
    }
  },

  // ✅ NEW: Send Quote
  send: async (req: Request, res: Response) => {
    try {
      const quote = await QuoteModel.findById(req.params.id).populate('clientId');
      if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

      // Send Email
      const client = quote.clientId as any;
      if (client?.email) {
        await EmailService.sendQuote(quote, client);
      }

      // Update Status
      quote.status = 'sent';
      await quote.save();

      res.json({ success: true, message: "Quote sent", data: quote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to send quote" });
    }
  },
};