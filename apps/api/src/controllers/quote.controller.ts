import { Request, Response } from 'express';
import { QuoteModel } from '../models/quote.model';
import { ClientModel } from '../models/client.model';
import { asyncHandler } from '../utils/asyncHandler';
import { quoteService } from '../services/quote.service';
import { buildCsv } from '../utils/csv';

export const QuoteController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';
    const clientId = req.query.clientId as string;
    const skip = (page - 1) * limit;

    const query: any = { createdBy: req.user?.id, removed: { $ne: true } };

    if (clientId) {
        query.clientId = clientId;
    }

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.number = searchNum;
      } else {
        if (clientId) {
             query.title = { $regex: search, $options: 'i' };
        } else {
            const clients = await ClientModel.find({
                userId: req.user?.id,
                removed: { $ne: true },
                name: { $regex: search, $options: 'i' }
            }).select('_id');
            const clientIds = clients.map(c => c._id);
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { clientId: { $in: clientIds } }          
            ];
        }
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
    const query: any = { createdBy: userId, removed: { $ne: true } };

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.number = searchNum;
      } else {
        const clients = await ClientModel.find({ userId, name: { $regex: search, $options: 'i' } }).select('_id');
        query.$or = [{ title: { $regex: search, $options: 'i' } }, { clientId: { $in: clients.map(c => c._id) } }];
      }
    }

    const quotes: any[] = await QuoteModel.find(query).populate('clientId').sort({ createdAt: -1 }).lean();

    const csv = buildCsv(quotes, [
      { header: 'Quote Number', value: (q: any) => q.number ?? '' },
      { header: 'Title', value: (q: any) => q.title ?? '' },
      { header: 'Client', value: (q: any) => q.clientId?.name ?? '' },
      { header: 'Total', value: (q: any) => q.total ?? 0 },
      { header: 'Status', value: (q: any) => q.status ?? '' },
      { header: 'Date', value: (q: any) => (q.date ? new Date(q.date).toISOString().slice(0, 10) : '') }
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="quotes-${dateTag}.csv"`);
    res.status(200).send(csv);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const quote = await quoteService.createQuote(userId, req.body);
    res.status(201).json({ success: true, data: quote });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const quote = await quoteService.updateQuote(String(req.params.id), userId, req.body);
    res.json({ success: true, data: quote });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    await quoteService.deleteQuote(String(req.params.id), userId);
    res.json({ success: true, message: "Quote deleted" });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const quote = await QuoteModel.findOne({ _id: req.params.id, createdBy: userId, removed: { $ne: true } }).populate('clientId');
    if (!quote) { res.status(404); throw new Error("Quote not found"); }
    res.json({ success: true, data: quote });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    await quoteService.sendQuote(String(req.params.id), userId);
    res.json({ success: true, message: "Quote sent" });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const { status } = req.body;
    const quote = await quoteService.updateStatus(String(req.params.id), userId, status);
    res.json({ success: true, data: quote });
  }),

  convertToInvoice: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const invoice = await quoteService.convertToInvoice(String(req.params.id), userId);
    res.json({ success: true, data: invoice, message: "Converted to invoice" });
  })
};