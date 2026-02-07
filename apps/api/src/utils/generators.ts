import { InvoiceModel } from '../models/invoice.model';
import { SettingsModel } from '../models/settings.model';


export const generateInvoiceNumber = async (userId?: string): Promise<number> => {
  
  const query = userId ? { createdBy: userId } : {};
  const lastInvoice = await InvoiceModel.findOne(query).sort({ number: -1 });
  
  
  if (lastInvoice && typeof lastInvoice.number === 'number') {
    return lastInvoice.number + 1;
  }

  
  if (userId) {
    const settings = await SettingsModel.findOne({ userId });
    if (settings && settings.invoiceStartNumber) {
        return settings.invoiceStartNumber;
    }
  }

  
  return 1000;
};