import mongoose, { Schema, Document } from 'mongoose';
// 1. IMPORT from your shared package
import { Invoice as IInvoiceDTO, InvoiceItem as IInvoiceItemDTO } from "@erp/types";

// 2. EXTEND the shared type
export interface IInvoiceDocument extends Document, Omit<IInvoiceDTO, '_id' | 'createdAt' | 'updatedAt'> {
  // We can add Mongoose-specific fields here if needed
  createdAt: Date;
  updatedAt: Date;
  amountPaid: number; // ✅ Ensure this is typed
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
    ref: 'Client',
    required: true
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

  // ✅ NEW FIELD: Amount Paid
  amountPaid: { type: Number, default: 0 }, 

  // Statuses
  status: { 
    type: String, 
    // ✅ UPDATE: Added 'overdue' to the list
    enum: ['draft', 'pending', 'sent', 'paid', 'overdue'], 
    default: 'draft' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'partially'], 
    default: 'unpaid' 
  },
  
  // System
  pdf: { type: String },
  removed: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

export const InvoiceModel = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);