import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { QuoteModel } from '../models/quote.model';
import { SettingsModel } from '../models/settings.model';

const router = Router();

// GET Public Invoice (No Auth Required)
router.get('/invoices/:id', asyncHandler(async (req, res) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, removed: { $ne: true } }).populate('clientId');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // We also need the company settings to display the logo/address on the public page
  const settings = await SettingsModel.findOne({ userId: (invoice as any).createdBy });
  res.json({ success: true, data: { invoice, settings } });
}));

// POST Public Payment (Simulate Payment)
router.post('/invoices/:id/pay', asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, removed: { $ne: true } });
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Update Payment Status
  const newPaid = (invoice.amountPaid || 0) + Number(amount);
  const newStatus = newPaid >= invoice.total ? 'paid' : 'partially';

  invoice.amountPaid = newPaid;
  invoice.paymentStatus = newStatus;
  
  // If fully paid, update main status too
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

// GET Public Client Portal (No Auth Required)
// Read-only view of a single client's invoices + quotes via an unguessable token.
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