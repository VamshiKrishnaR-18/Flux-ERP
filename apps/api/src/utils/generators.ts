import { InvoiceModel } from '../models/invoice.model';
import { SettingsModel } from '../models/settings.model';

// ✅ Updated to accept userId context
export const generateInvoiceNumber = async (userId?: string): Promise<number> => {
  // 1. Try to find the last invoice created by this user
  const query = userId ? { createdBy: userId } : {};
  const lastInvoice = await InvoiceModel.findOne(query).sort({ number: -1 });
  
  // ✅ FIX: Explicitly check if 'number' is defined
  if (lastInvoice && typeof lastInvoice.number === 'number') {
    return lastInvoice.number + 1;
  }

  // 2. If no invoice exists, check Settings for a custom start number
  if (userId) {
    const settings = await SettingsModel.findOne({ userId });
    if (settings && settings.invoiceStartNumber) {
        return settings.invoiceStartNumber;
    }
  }

  // 3. Fallback default
  return 1000;
};