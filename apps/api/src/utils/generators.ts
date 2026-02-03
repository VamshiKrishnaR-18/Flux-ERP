import { InvoiceModel } from '../models/invoice.model';

export const generateInvoiceNumber = async (): Promise<number> => {
  const lastInvoice = await InvoiceModel.findOne().sort({ number: -1 });
  const lastNumber = lastInvoice?.number ?? 1000;
  return lastNumber + 1;
};