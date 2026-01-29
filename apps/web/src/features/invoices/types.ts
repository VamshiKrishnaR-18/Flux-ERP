export interface InvoiceItem {
  itemName: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  _id: string;
  number: number;
  year: number;
  clientId: string | { _id: string; name: string }; // Can be ID or populated object
  date: string;
  expiredDate: string;
  items: InvoiceItem[];
  subTotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  notes?: string;
}