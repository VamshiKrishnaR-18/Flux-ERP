import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { QuoteModel } from '../models/quote.model';
import { SettingsModel } from '../models/settings.model';
import { generateInvoiceNumber } from '../utils/generators';
import { productService } from '../services/product.service';
import { logActivity } from '../utils/activity';

const router = Router();


router.get('/invoices/:id', asyncHandler(async (req, res) => {
  const invoice: any = await InvoiceModel.findOne({ _id: req.params.id, removed: { $ne: true } }).populate('clientId');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Log Activity for Invoice View
  await logActivity({
    userId: invoice.createdBy,
    action: 'updated',
    resourceType: 'Invoice',
    resourceId: String(invoice._id),
    resourceName: `Invoice #${invoice.number}`,
    details: ['Client viewed invoice public link']
  });

  
  const settings = await SettingsModel.findOne({ userId: (invoice as any).createdBy });
  res.json({ success: true, data: { invoice, settings } });
}));


router.post('/invoices/:id/pay', asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, removed: { $ne: true } });
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  
  const newPaid = (invoice.amountPaid || 0) + Number(amount);
  const newStatus = newPaid >= invoice.total ? 'paid' : 'partially';

  invoice.amountPaid = newPaid;
  invoice.paymentStatus = newStatus;
  
  
  if (newStatus === 'paid') {
      invoice.status = 'paid';
  }

  await invoice.save();

  res.json({ 
    success: true, 
    message: "Payment processed successfully", 
    data: invoice 
  });
}));

router.post('/quotes/:id/approve', asyncHandler(async (req, res) => {
  const quote: any = await QuoteModel.findOne({ _id: req.params.id });
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  if (quote.status === 'converted' || quote.status === 'accepted') {
    res.status(400);
    throw new Error('Quote already processed');
  }

  const userId = quote.createdBy;
  const settings = await SettingsModel.findOne({ userId }).lean();
  const nextNumber = await generateInvoiceNumber(userId);

  // Create Invoice from Quote
  const invoice = await InvoiceModel.create({
    number: nextNumber,
    year: new Date().getFullYear(),
    invoicePrefix: settings?.invoicePrefix || 'INV-',
    date: new Date(),
    expiredDate: new Date(Date.now() + (settings?.defaultPaymentTerms || 14) * 24 * 60 * 60 * 1000),
    clientId: quote.clientId,
    createdBy: userId,
    items: quote.items,
    subTotal: quote.subTotal,
    taxRate: quote.taxRate,
    taxTotal: quote.taxTotal,
    total: quote.total,
    discount: quote.discount,
    currency: quote.currency,
    status: 'sent', // Automatically mark as sent since it's approved by client
    notes: quote.notes,
    auditLogs: [{ action: 'created', userId: 'SYSTEM', at: new Date(), changes: ['Converted from Quote #' + quote.number] }]
  });

  // Update Quote status
  quote.status = 'converted';
  quote.convertedInvoiceId = invoice._id;
  await quote.save();

  // Adjust Stock
  await productService.adjustStock(quote.items, 'deduct', userId);

  // Log Activity
  await logActivity({
    userId,
    action: 'updated',
    resourceType: 'Quote',
    resourceId: String(quote._id),
    resourceName: `Quote #${quote.number}`,
    details: ['Approved and converted to Invoice #' + invoice.number]
  });

  await logActivity({
    userId,
    action: 'created',
    resourceType: 'Invoice',
    resourceId: String(invoice._id),
    resourceName: `Invoice #${invoice.number}`,
    details: ['Generated from Quote #' + quote.number]
  });

  res.json({
    success: true,
    message: "Quote approved and converted to invoice",
    data: { quote, invoice }
  });
}));

router.post('/quotes/:id/reject', asyncHandler(async (req, res) => {
  const quote = await QuoteModel.findOne({ _id: req.params.id });
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found');
  }

  quote.status = 'rejected';
  await quote.save();

  res.json({
    success: true,
    message: "Quote rejected",
    data: quote
  });
}));

router.get('/portal/:token', asyncHandler(async (req, res) => {
  const token = req.params.token;
  if (!token) {
    res.status(400);
    throw new Error('Portal token is required');
  }

  const client: any = await ClientModel.findOne({ portalToken: token, removed: false }).lean();
  if (!client) {
    res.status(404);
    throw new Error('Portal not found');
  }

  const userId = client.userId;

  // Log Activity for Portal View
  await logActivity({
    userId,
    action: 'updated', // Using updated for 'viewed' activity
    resourceType: 'Client',
    resourceId: String(client._id),
    resourceName: client.name,
    details: ['Client viewed portal']
  });
  const settings = await SettingsModel.findOne({ userId }).lean();

  const [invoices, quotes] = await Promise.all([
    InvoiceModel.find({
      createdBy: userId,
      clientId: client._id,
      removed: { $ne: true },
      status: { $ne: 'draft' }
    })
      .select('number year date expiredDate total status currency amountPaid paymentStatus invoicePrefix createdAt')
      .sort({ date: -1 })
      .lean(),
    QuoteModel.find({
      createdBy: userId,
      clientId: client._id,
      status: { $ne: 'draft' }
    })
      .select('number title date expiredDate total status currency createdAt')
      .sort({ date: -1 })
      .lean()
  ]);

  res.json({
    success: true,
    data: {
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        address: client.address,
        status: client.status
      },
      settings,
      invoices,
      quotes
    }
  });
}));

export default router;