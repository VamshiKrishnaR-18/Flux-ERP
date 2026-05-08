import { QuoteModel } from '../models/quote.model';
import { ClientModel } from '../models/client.model';
import { EmailService, emailService } from './email.service';
import { logActivity } from '../utils/activity';
import { sanitize } from '../utils/sanitize';
import { invoiceService } from './invoice.service';

export class QuoteService {
  constructor(private emailService: EmailService) {}

  async createQuote(userId: string, data: any) {
    const sanitizedData = sanitize(data);
    const quoteNumber = await this.generateQuoteNumber(userId);
    
    const quote = await QuoteModel.create({
      ...sanitizedData,
      number: quoteNumber,
      createdBy: userId
    });

    await logActivity({
      userId,
      action: 'created',
      resourceType: 'Quote',
      resourceId: String(quote._id),
      resourceName: String(quote.title)
    });

    return quote;
  }

  async updateQuote(id: string, userId: string, data: any) {
    const quote = await QuoteModel.findOneAndUpdate(
      { _id: id, createdBy: userId },
      sanitize(data),
      { new: true }
    );
    if (!quote) throw new Error("Quote not found");

    await logActivity({
      userId,
      action: 'updated',
      resourceType: 'Quote',
      resourceId: id,
      resourceName: String(quote.title),
      details: Object.keys(data)
    });

    return quote;
  }

  async deleteQuote(id: string, userId: string) {
    const quote = await QuoteModel.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { removed: true },
      { new: true }
    );
    if (!quote) throw new Error("Quote not found");

    await logActivity({
      userId,
      action: 'deleted',
      resourceType: 'Quote',
      resourceId: id,
      resourceName: String(quote.title)
    });

    return true;
  }

  async sendQuote(id: string, userId: string) {
    const quote = await QuoteModel.findOne({ _id: id, createdBy: userId }).populate('clientId');
    if (!quote) throw new Error("Quote not found");

    const client = quote.clientId as any;
    if (client?.email) {
      await this.emailService.sendQuote(quote, client);
    }

    await logActivity({
      userId,
      action: 'sent',
      resourceType: 'Quote',
      resourceId: id,
      resourceName: String(quote.title),
      details: [`Emailed to ${client?.email}`]
    });

    return true;
  }

  async updateStatus(id: string, userId: string, status: string) {
    const quote = await QuoteModel.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { status },
      { new: true }
    );
    if (!quote) throw new Error("Quote not found");

    await logActivity({
      userId,
      action: 'updated',
      resourceType: 'Quote',
      resourceId: id,
      resourceName: String(quote.title),
      details: [`Status changed to ${status}`]
    });

    return quote;
  }

  async convertToInvoice(id: string, userId: string) {
    const quote = await QuoteModel.findOne({ _id: id, createdBy: userId });
    if (!quote) throw new Error("Quote not found");

    if (quote.status === 'converted') {
      throw new Error("Quote already converted to invoice");
    }

    const invoiceData = {
      clientId: quote.clientId,
      items: quote.items,
      notes: quote.notes,
      currency: quote.currency,
      exchangeRate: quote.exchangeRate,
      baseCurrency: quote.baseCurrency,
      taxRate: quote.taxRate,
      discount: quote.discount,
      status: 'draft',
      date: new Date(),
      expiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default 14 days
    };

    const invoice = await invoiceService.createInvoice(userId, invoiceData);

    quote.status = 'converted';
    quote.convertedInvoiceId = invoice._id;
    await quote.save();

    await logActivity({
      userId,
      action: 'converted',
      resourceType: 'Quote',
      resourceId: id,
      resourceName: String(quote.title),
      details: [`Converted to Invoice #${invoice.number}`]
    });

    return invoice;
  }

  private async generateQuoteNumber(userId?: string) {
    const last = await QuoteModel.findOne({ createdBy: userId }).sort({ number: -1 });
    return ((last as any)?.number ?? 1000) + 1;
  }
}

export const quoteService = new QuoteService(emailService);