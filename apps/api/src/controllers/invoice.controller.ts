import { Request, Response } from 'express';
import { InvoiceModel } from '../models/invoice.model';
import { asyncHandler } from '../utils/asyncHandler';
import { invoiceService } from '../services/invoice.service';
import { CreateInvoiceSchema } from "@erp/types";
import { ClientModel } from '../models/client.model';
import { buildCsv } from '../utils/csv';
import { emailService } from '../services/email.service';

export const InvoiceController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const clientId = req.query.clientId as string;
    const month = req.query.month as string;
    const year = req.query.year as string;
    const skip = (page - 1) * limit;

    const query: any = { createdBy: req.user?.id, removed: { $ne: true } };

    if (clientId) {
        query.clientId = clientId;
    }

    if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        query.date = { $gte: startDate, $lte: endDate };
    }

    if (search) {
        const searchNum = Number(search);
        if (!isNaN(searchNum)) {
            query.number = searchNum;
        } else {
             if (!clientId) {
                const clients = await ClientModel.find({
                    userId: req.user?.id,
                    name: { $regex: search, $options: 'i' }
                }).select('_id');
                const clientIds = clients.map(c => c._id);
                query.clientId = { $in: clientIds };
             }
        }
    }

    const [total, invoices] = await Promise.all([
      InvoiceModel.countDocuments(query),
      InvoiceModel.find(query)
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      success: true,
      data: invoices,
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

    const query: any = { createdBy: userId, removed: { $ne: true } };

    const invoices: any[] = await InvoiceModel.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const csv = buildCsv(invoices, [
      { header: 'Invoice Number', value: (inv: any) => `${inv.invoicePrefix ?? ''}${inv.number ?? ''}` },
      { header: 'Client Name', value: (inv: any) => inv.clientId?.name ?? '' },
      { header: 'Client Email', value: (inv: any) => inv.clientId?.email ?? '' },
      { header: 'Date', value: (inv: any) => (inv.date ? new Date(inv.date).toISOString().slice(0, 10) : '') },
      { header: 'Due Date', value: (inv: any) => (inv.expiredDate ? new Date(inv.expiredDate).toISOString().slice(0, 10) : '') },
      { header: 'Status', value: (inv: any) => inv.status ?? '' },
      { header: 'Currency', value: (inv: any) => inv.currency ?? '' },
      { header: 'Subtotal', value: (inv: any) => inv.subTotal ?? '' },
      { header: 'Tax', value: (inv: any) => inv.taxTotal ?? '' },
      { header: 'Discount', value: (inv: any) => inv.discount ?? '' },
      { header: 'Total', value: (inv: any) => inv.total ?? '' },
      { header: 'Amount Paid', value: (inv: any) => inv.amountPaid ?? 0 },
      { header: 'Payment Status', value: (inv: any) => inv.paymentStatus ?? '' },
      { header: 'Notes', value: (inv: any) => inv.notes ?? '' },
      { header: 'Invoice ID', value: (inv: any) => inv._id ?? '' }
    ]);

    const dateTag = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${dateTag}.csv"`);
    res.status(200).send(csv);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await InvoiceModel.findOne({ 
      _id: req.params.id, 
      createdBy: req.user?.id,
      removed: { $ne: true }
    }).populate('clientId');
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
    res.json({ success: true, data: invoice });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400);
      throw new Error(validation.error.errors[0]?.message || "Invalid Input");
    }
    
    const newInvoice = await invoiceService.createInvoice(userId, validation.data);
    res.status(201).json({ success: true, message: "Invoice created", data: newInvoice });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const invoice = await invoiceService.updateInvoice(String(id), userId, req.body);
    res.json({ success: true, message: "Invoice updated", data: invoice });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    await invoiceService.deleteInvoice(String(req.params.id), userId);
    res.json({ success: true, message: "Invoice deleted" });
  }),

  // Add Payment
  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    
    const invoice = await InvoiceModel.findOne({ _id: id, createdBy: req.user?.id });
    if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

    const newPaid = (invoice.amountPaid || 0) + amount;
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partially';

    invoice.amountPaid = newPaid;
    invoice.paymentStatus = newStatus; 
    if (newStatus === 'paid') {
        invoice.status = 'paid';
    }
    
    await invoice.save();

    res.json({ success: true, message: "Payment recorded", data: invoice });
  }),

  // Send Invoice Email
  send: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const invoice = await InvoiceModel.findOne({ _id: id, createdBy: userId }).populate('clientId');
    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const client = invoice.clientId as any;
    if (!client || !client.email) {
      res.status(400);
      throw new Error("Client email not found");
    }

    const sent = await emailService.sendInvoice(invoice, client);
    if (!sent) {
      res.status(500);
      throw new Error("Failed to send email");
    }

    // Update status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    res.json({ success: true, message: "Invoice sent successfully" });
  }),

  // Send Overdue Reminder
  remind: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const invoice = await InvoiceModel.findOne({ _id: id, createdBy: userId }).populate('clientId');
    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const client = invoice.clientId as any;
    if (!client || !client.email) {
      res.status(400);
      throw new Error("Client email not found");
    }

    const sent = await emailService.sendReminder(invoice, client);
    if (!sent) {
      res.status(500);
      throw new Error("Failed to send reminder");
    }

    res.json({ success: true, message: "Reminder sent successfully" });
  })
};