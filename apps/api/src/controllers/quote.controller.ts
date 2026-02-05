import { Request, Response } from 'express';
import { QuoteModel } from '../models/quote.model';
import { ClientModel } from '../models/client.model'; // 👈 Import ClientModel
import { InvoiceModel } from '../models/invoice.model';
import { EmailService } from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInvoiceNumber } from '../utils/generators';
import { buildCsv } from '../utils/csv';

const generateQuoteNumber = async (userId?: string) => {
  const last = await QuoteModel.findOne({ createdBy: userId }).sort({ number: -1 });
  return ((last as any)?.number ?? 1000) + 1;
};

export const QuoteController = {
  
  // ✅ UPDATED: Server-Side Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || ''; // 👈 Get Search
    const skip = (page - 1) * limit;

    const query: any = { createdBy: req.user?.id };

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
            userId: req.user?.id,
            removed: false,
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

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const search = (req.query.search as string) || '';

    const query: any = { createdBy: userId };

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.number = searchNum;
      } else {
        const clients = await ClientModel.find({
          userId,
          removed: false,
          name: { $regex: search, $options: 'i' }
        }).select('_id');

        const clientIds = clients.map((c: any) => c._id);

        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { clientId: { $in: clientIds } }
        ];
      }
    }

    const quotes: any[] = await QuoteModel.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const csv = buildCsv(quotes, [
      { header: 'Quote Number', value: (q: any) => q.number ?? '' },
      { header: 'Title', value: (q: any) => q.title ?? '' },
      { header: 'Client Name', value: (q: any) => q.clientId?.name ?? '' },
      { header: 'Client Email', value: (q: any) => q.clientId?.email ?? '' },
      { header: 'Date', value: (q: any) => (q.date ? new Date(q.date).toISOString().slice(0, 10) : '') },
      { header: 'Valid Until', value: (q: any) => (q.expiredDate ? new Date(q.expiredDate).toISOString().slice(0, 10) : '') },
      { header: 'Status', value: (q: any) => q.status ?? '' },
      { header: 'Currency', value: (q: any) => q.currency ?? '' },
      { header: 'Subtotal', value: (q: any) => q.subTotal ?? '' },
      { header: 'Tax', value: (q: any) => q.taxTotal ?? '' },
      { header: 'Discount', value: (q: any) => q.discount ?? '' },
      { header: 'Total', value: (q: any) => q.total ?? '' },
      { header: 'Notes', value: (q: any) => q.notes ?? '' },
      { header: 'Quote ID', value: (q: any) => q._id ?? '' }
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="quotes-${dateTag}.csv"`);
    res.status(200).send(csv);
  }),

  // ... (Keep the rest: getOne, create, convertToInvoice, delete, send) ...
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findOne({ _id: req.params.id, createdBy: req.user?.id }).populate('clientId');
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    res.json({ success: true, data: quote });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    // Ensure client belongs to this user (prevents cross-tenant access)
    const client = await ClientModel.findOne({ _id: req.body?.clientId, userId: req.user?.id, removed: false });
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    const nextNumber = await generateQuoteNumber(req.user?.id);
    const newQuote = await QuoteModel.create({
      ...req.body,
      number: nextNumber,
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: newQuote });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status?: string };
    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Only accepted/rejected status updates are supported');
    }

    const quote = await QuoteModel.findOne({ _id: req.params.id, createdBy: req.user?.id }).populate('clientId');
    if (!quote) { res.status(404); throw new Error('Quote not found'); }

    // Allowed transitions: sent -> accepted/rejected
    if (quote.status !== 'sent') {
      res.status(400);
      throw new Error(`Cannot mark quote as ${status} when status is ${quote.status}`);
    }

    quote.status = status as any;
    await quote.save();

    res.json({ success: true, message: 'Quote status updated', data: quote });
  }),

  convertToInvoice: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findOne({ _id: req.params.id, createdBy: req.user?.id });
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    if (quote.status === 'converted') { res.status(400); throw new Error("Already converted"); }
    if (quote.status !== 'accepted') {
      res.status(400);
      throw new Error('Quote must be accepted before converting to an invoice');
    }

    const nextInvNumber = await generateInvoiceNumber(String(quote.createdBy || req.user?.id));
    const quoteData = quote as any; 

    const newInvoice = await InvoiceModel.create({
      number: nextInvNumber,
      year: new Date().getFullYear(),
      date: new Date(),
      expiredDate: quoteData.expiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      clientId: quoteData.clientId,
      items: quoteData.items,
      subTotal: quoteData.subTotal,
      taxRate: quoteData.taxRate,
      taxTotal: quoteData.taxTotal,
      total: quoteData.total,
      discount: quoteData.discount,
      notes: `Converted from Quote #${quoteData.number}`,
      status: 'draft',
      createdBy: String(quote.createdBy || req.user?.id),
      converted: { from: 'quote', quoteId: quote._id }
    });

    quote.status = 'converted';
    quote.convertedInvoiceId = newInvoice._id as any;
    await quote.save();

    res.json({ success: true, message: "Converted to Invoice", data: newInvoice });
  }),
  
  delete: asyncHandler(async (req: Request, res: Response) => {
    const deleted = await QuoteModel.findOneAndDelete({ _id: req.params.id, createdBy: req.user?.id });
    if (!deleted) { res.status(404); throw new Error('Quote not found'); }
    res.json({ success: true, message: "Quote deleted" });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const quote = await QuoteModel.findOne({ _id: req.params.id, createdBy: req.user?.id }).populate('clientId');
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    if (quote.status === 'converted') {
      res.status(400);
      throw new Error('Already converted');
    }

    const client = quote.clientId as any;
    if (client?.email) {
      await EmailService.sendQuote(quote, client);
    }

    // Only move draft -> sent. Keep accepted/rejected as-is.
    if (quote.status === 'draft') quote.status = 'sent';
    await quote.save();

    res.json({ success: true, message: "Quote sent", data: quote });
  }),
};