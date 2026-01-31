import mongoose, { Schema, Document } from 'mongoose';

const QuoteSchema: Schema = new Schema({
  number: { type: Number, required: true },
  title: { type: String, required: true }, // e.g., "Web Redesign Project"
  date: { type: Date, required: true },
  expiredDate: { type: Date, required: true },
  
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{
    itemName: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  notes: String,
  
  // Financials
  currency: { type: String, default: 'USD' },
  subTotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },

  // Status
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'converted'], 
    default: 'draft' 
  },
  
  // Link to Invoice (if converted)
  convertedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const QuoteModel = mongoose.model('Quote', QuoteSchema);