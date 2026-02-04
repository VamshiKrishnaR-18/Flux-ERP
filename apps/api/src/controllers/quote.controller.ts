import { Request, Response } from 'express';
import { QuoteModel } from '../models/quote.model';
import { ClientModel } from '../models/client.model'; // 👈 Import ClientModel
import { InvoiceModel } from '../models/invoice.model';
import { EmailService } from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInvoiceNumber } from '../utils/generators';

const generateQuoteNumber = async () => {
  const last = await QuoteModel.findOne().sort({ number: -1 });
  return ((last as any)?.number ?? 1000) + 1;
};

export const QuoteController = {
  
  // ✅ UPDATED: Server-Side Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || ''; // 👈 Get Search
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      const searchNum = Number(search);
      // 1. Search by Number
      if (!isNaN(searchNum)) {
        query.number = searchNum;
      } 
      // 2. Search by Title
      else {
        // We search Title OR Client Name using $or
        // First, find matching clients
        const clients = await ClientModel.find({ 
            name: { $regex: search, $options: 'i' } 
        }).select('_id');
        
        const clientIds = clients.map(c => c._id);

        query.$or = [
            { title: { $regex: search, $options: 'i' } }, // Match Title
            { clientId: { $in: clientIds } }              // Match Client Name
        ];
      }
    }

    const quotes = await QuoteModel.find(query)
      .populate('clientId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await QuoteModel.countDocuments(query);

    res.json({ 
      success: true, 
      data: quotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }),

  // ... (Keep the rest: getOne, create, convertToInvoice, delete, send) ...
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findById(req.params.id).populate('clientId');
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    res.json({ success: true, data: quote });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const nextNumber = await generateQuoteNumber();
    const newQuote = await QuoteModel.create({
      ...req.body,
      number: nextNumber,
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: newQuote });
  }),

  convertToInvoice: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findById(req.params.id);
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    if (quote.status === 'converted') { res.status(400); throw new Error("Already converted"); }

    const nextInvNumber = await generateInvoiceNumber();
    const quoteData = quote as any; 

    const newInvoice = await InvoiceModel.create({
      number: nextInvNumber,
      year: new Date().getFullYear(),
      date: new Date(),
      expiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      clientId: quoteData.clientId,
      items: quoteData.items,
      subTotal: quoteData.subTotal,
      taxRate: quoteData.taxRate,
      taxTotal: quoteData.taxTotal,
      total: quoteData.total,
      discount: quoteData.discount,
      notes: `Converted from Quote #${quoteData.number}`,
      status: 'draft',
      converted: { from: 'quote', quoteId: quote._id }
    });

    quote.status = 'converted';
    quote.convertedInvoiceId = newInvoice._id as any;
    await quote.save();

    res.json({ success: true, message: "Converted to Invoice", data: newInvoice });
  }),
  
  delete: asyncHandler(async (req: Request, res: Response) => {
    await QuoteModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Quote deleted" });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findById(req.params.id).populate('clientId');
    if (!quote) { res.status(404); throw new Error("Quote not found"); }

    const client = quote.clientId as any;
    if (client?.email) {
      await EmailService.sendQuote(quote, client);
    }

    quote.status = 'sent';
    await quote.save();

    res.json({ success: true, message: "Quote sent", data: quote });
  }),
};