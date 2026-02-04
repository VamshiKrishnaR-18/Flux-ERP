import { Request, Response } from 'express';
import { QuoteModel } from '../models/quote.model';
import { InvoiceModel } from '../models/invoice.model';
import { EmailService } from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInvoiceNumber } from '../utils/generators';

const generateQuoteNumber = async () => {
  const last = await QuoteModel.findOne().sort({ number: -1 });
  return ((last as any)?.number ?? 1000) + 1;
};

export const QuoteController = {
  // ✅ UPDATED: Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const quotes = await QuoteModel.find()
      .populate('clientId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await QuoteModel.countDocuments();

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