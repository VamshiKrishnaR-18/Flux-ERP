import mongoose, { Schema, Document } from 'mongoose';
import { Invoice as IInvoiceDTO } from "@erp/types";


export interface IInvoiceDocument extends Document, Omit<IInvoiceDTO, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  amountPaid: number;
  removed: boolean;
  createdBy: string;
  invoicePrefix?: string;
  auditLogs?: { action: 'created' | 'updated'; userId: string; at: Date; changes?: string[] }[];
}


const InvoiceSchema: Schema = new Schema({
  
  number: { type: Number, required: true },
  year: { type: Number, required: true },
  invoicePrefix: { type: String },
  recurring: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter', 'none'], 
    default: 'none' 
  },

  
  date: { type: Date, required: true },
  expiredDate: { type: Date, required: true },
  
  
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client',
    required: true
  },
  createdBy: { type: String, required: true },

  // Content
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
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

  // Status & Payment
  amountPaid: { type: Number, default: 0 }, 
  status: { 
    type: String, 
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
  removed: { type: Boolean, default: false },
  auditLogs: [{
    action: { type: String, enum: ['created', 'updated'], required: true },
    userId: { type: String, required: true },
    at: { type: Date, default: Date.now },
    changes: [{ type: String }]
  }]

}, { 
  timestamps: true 
});

export const InvoiceModel = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);
