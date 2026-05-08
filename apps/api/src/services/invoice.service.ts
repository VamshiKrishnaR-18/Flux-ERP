import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { SettingsModel } from '../models/settings.model';
import { ProductService, productService } from './product.service';
import { generateInvoiceNumber } from '../utils/generators';
import { calculateInvoiceTotals } from "@erp/types";
import { logActivity } from '../utils/activity';
import { sanitize } from '../utils/sanitize';

export class InvoiceService {
  constructor(private productService: ProductService) {}

  async createInvoice(userId: string, data: any) {
    const sanitizedData = sanitize(data);
    const { clientId, items } = sanitizedData;

    // Validate Client
    const clientExists = await ClientModel.findOne({ _id: clientId, userId, removed: false });
    if (!clientExists) throw new Error("Client not found");

    const nextNumber = await generateInvoiceNumber(userId);
    const settings = await SettingsModel.findOne({ userId }).select('invoicePrefix').lean();

    // Recalculate Totals on Server for Integrity
    const { subTotal, taxTotal, total } = calculateInvoiceTotals({
      items: items.map((i: any) => ({ quantity: i.quantity, price: i.price })),
      taxRate: sanitizedData.taxRate || 0,
      discount: sanitizedData.discount || 0
    });

    const newInvoice = await InvoiceModel.create({
      ...sanitizedData,
      subTotal,
      taxTotal,
      total,
      number: nextNumber,
      year: new Date().getFullYear(),
      createdBy: userId,
      invoicePrefix: settings?.invoicePrefix,
      auditLogs: [{ action: 'created', userId, at: new Date(), changes: [] }]
    });

    // Adjust Stock
    await this.productService.adjustStock(items, 'deduct', userId);

    await logActivity({
      userId,
      action: 'created',
      resourceType: 'Invoice',
      resourceId: String(newInvoice._id),
      resourceName: `Invoice #${newInvoice.number}`,
      after: newInvoice.toObject()
    });

    return newInvoice;
  }

  async updateInvoice(id: string, userId: string, data: any) {
    const existing = await InvoiceModel.findOne({ _id: id, createdBy: userId });
    if (!existing) throw new Error("Invoice not found");

    const sanitizedBody = sanitize(data || {});
    const updateData = { ...sanitizedBody } as Record<string, unknown>;

    // Recalculate totals if items, taxRate, or discount changed
    if (sanitizedBody.items || sanitizedBody.taxRate !== undefined || sanitizedBody.discount !== undefined) {
      const items = sanitizedBody.items || existing.items;
      const taxRate = sanitizedBody.taxRate !== undefined ? sanitizedBody.taxRate : existing.taxRate;
      const discount = sanitizedBody.discount !== undefined ? sanitizedBody.discount : existing.discount;

      const { subTotal, taxTotal, total } = calculateInvoiceTotals({
        items: items.map((i: any) => ({ quantity: i.quantity, price: i.price })),
        taxRate,
        discount
      });
      updateData.subTotal = subTotal;
      updateData.taxTotal = taxTotal;
      updateData.total = total;
    }

    delete updateData.auditLogs;
    const changes = Object.keys(updateData);

    const invoice = await InvoiceModel.findOneAndUpdate(
      { _id: id, createdBy: userId },
      {
        $set: updateData,
        $push: { auditLogs: { action: 'updated', userId, at: new Date(), changes } }
      },
      { new: true }
    );
    if (!invoice) throw new Error("Invoice not found");

    if (Array.isArray(data?.items)) {
      await this.productService.adjustStock(existing.items, 'restore', userId);
      await this.productService.adjustStock(data.items, 'deduct', userId);
    }

    await logActivity({
      userId,
      action: 'updated',
      resourceType: 'Invoice',
      resourceId: id,
      resourceName: `Invoice #${invoice.number}`,
      details: changes,
      before: existing.toObject(),
      after: invoice.toObject()
    });

    return invoice;
  }

  async deleteInvoice(id: string, userId: string) {
    const invoice = await InvoiceModel.findOne({ _id: id, createdBy: userId, removed: { $ne: true } });
    if (!invoice) throw new Error("Invoice not found");

    await this.productService.adjustStock(invoice.items, 'restore', userId);

    invoice.removed = true;
    await invoice.save();

    await logActivity({
      userId,
      action: 'deleted',
      resourceType: 'Invoice',
      resourceId: id,
      resourceName: `Invoice #${invoice.number}`
    });

    return true;
  }
}

export const invoiceService = new InvoiceService(productService);