import mongoose, { Schema, Document } from 'mongoose';

// === INTERFACES ===
export interface IInvoiceItem {
  itemName: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IInvoice extends Document {
  // Identification
  number: number;
  year: number;
  recurring: 'daily' | 'weekly' | 'monthly' | 'annually' | 'quarter' | 'none';
  
  // Dates
  date: Date;
  expiredDate: Date; // Due Date
  
  // Relations
  clientId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId; // Admin who created it
  
  // Conversion (Future Proofing for Quotes feature)
  converted?: {
    from: 'quote' | 'offer';
    quoteId?: mongoose.Types.ObjectId;
    offerId?: mongoose.Types.ObjectId;
  };

  // Content
  items: IInvoiceItem[];
  notes?: string;
  
  // Financials
  currency: string;
  subTotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  credit: number;
  discount: number;
  
  // Statuses
  status: 'draft' | 'pending' | 'sent' | 'refunded' | 'cancelled' | 'on hold';
  paymentStatus: 'unpaid' | 'paid' | 'partially';
  
  // System
  pdf?: string; // Path to generated PDF
  removed: boolean; // Soft delete flag
}

// === SCHEMA ===
const InvoiceSchema: Schema = new Schema({
  // Identification
  number: { type: Number, required: true },
  year: { type: Number, required: true },
  recurring: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter', 'none'], 
    default: 'none' 
  },

  // Dates
  date: { type: Date, required: true },
  expiredDate: { type: Date, required: true },
  
  // Relations
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', // Links to your existing Client model
    required: true,
    autopopulate: true 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Conversion
  converted: {
    from: { type: String, enum: ['quote', 'offer'] },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }
  },

  // Content
  items: [{
    itemName: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  notes: { type: String },

  // Financials
  currency: { type: String, required: true, default: 'USD', uppercase: true },
  subTotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },

  // Statuses
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold'], 
    default: 'draft' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'partially'], 
    default: 'unpaid' 
  },
  
  // System
  pdf: { type: String },
  removed: { type: Boolean, default: false } // We use this instead of actually deleting data
}, { 
  timestamps: true 
});

// Enable auto-population if needed (requires installing mongoose-autopopulate, or we handle it in controller)
// InvoiceSchema.plugin(require('mongoose-autopopulate'));

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', InvoiceSchema);