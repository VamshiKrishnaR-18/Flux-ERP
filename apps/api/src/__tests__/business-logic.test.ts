import { calculateInvoiceTotals } from '@erp/types';
import { processRecurringInvoices } from '../jobs/cron';
import { InvoiceModel } from '../models/invoice.model';
import { ClientModel } from '../models/client.model';
import { EmailService } from '../services/email.service';
import { generateInvoiceNumber } from '../utils/generators';

jest.mock('../models/invoice.model');
jest.mock('../models/client.model');
jest.mock('../services/email.service');
jest.mock('../utils/generators');
jest.mock('../utils/logger');

describe('Business Logic - Invoice Calculations', () => {
  it('should correctly calculate subtotal, tax, and total', () => {
    const params = {
      items: [
        { quantity: 2, price: 100 }, // 200
        { quantity: 1, price: 50 },  // 50
      ],
      taxRate: 10, // 10% of 250 = 25
      discount: 20, // 250 + 25 - 20 = 255
    };

    const result = calculateInvoiceTotals(params);

    expect(result.subTotal).toBe(250);
    expect(result.taxTotal).toBe(25);
    expect(result.total).toBe(255);
  });

  it('should handle zero tax and zero discount', () => {
    const params = {
      items: [
        { quantity: 5, price: 20 },
      ],
      taxRate: 0,
      discount: 0,
    };

    const result = calculateInvoiceTotals(params);

    expect(result.subTotal).toBe(100);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(100);
  });

  it('should round to 2 decimal places', () => {
    const params = {
      items: [
        { quantity: 1, price: 33.333 },
      ],
      taxRate: 8.5,
      discount: 0,
    };

    const result = calculateInvoiceTotals(params);

    // subTotal: 33.333 -> 33.33
    // tax: 33.333 * 0.085 = 2.833305 -> 2.83
    // total: 33.333 + 2.833305 = 36.166305 -> 36.17
    
    expect(result.subTotal).toBe(33.33);
    expect(result.taxTotal).toBe(2.83);
    expect(result.total).toBe(36.17);
  });
});

describe('Business Logic - Recurring Invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a new invoice if the next date is today or earlier', async () => {
    const today = new Date();
    const lastDate = new Date(today);
    lastDate.setMonth(today.getMonth() - 1); // Last month

    const mockInvoice = {
      _id: 'original-id',
      number: 100,
      clientId: 'client-id',
      createdBy: 'user-id',
      recurring: 'monthly',
      date: lastDate,
      expiredDate: new Date(lastDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      lastRecurringAt: lastDate,
      toObject: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(true),
    };

    (InvoiceModel.find as jest.Mock).mockResolvedValue([mockInvoice]);
    (generateInvoiceNumber as jest.Mock).mockResolvedValue(101);
    (ClientModel.findById as jest.Mock).mockResolvedValue({ _id: 'client-id', email: 'test@example.com' });
    (EmailService.sendInvoice as jest.Mock).mockResolvedValue(true);

    await processRecurringInvoices();

    expect(InvoiceModel.prototype.constructor).toHaveBeenCalled;
    expect(mockInvoice.save).toHaveBeenCalled(); // Original invoice updated
    expect(EmailService.sendInvoice).toHaveBeenCalled();
  });

  it('should not generate an invoice if the next date is in the future', async () => {
    const today = new Date();
    const lastDate = new Date(today); // Next date will be in the future

    const mockInvoice = {
      recurring: 'monthly',
      date: lastDate,
      lastRecurringAt: lastDate,
    };

    (InvoiceModel.find as jest.Mock).mockResolvedValue([mockInvoice]);

    await processRecurringInvoices();

    expect(generateInvoiceNumber).not.toHaveBeenCalled();
  });
});
