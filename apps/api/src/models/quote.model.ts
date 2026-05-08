import mongoose, { Schema, Document } from 'mongoose';

const QuoteSchema: Schema = new Schema({
  number: { type: Number, required: true },
  title: { type: String, required: true }, 
  date: { type: Date, required: true, index: true },
  expiredDate: { type: Date, required: true, index: true },
  
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  items: [{
    itemName: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  notes: String,
  
  
  currency: { type: String, default: 'USD' },
  subTotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },

 
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'converted'], 
    default: 'draft',
    index: true
  },
  
  
  convertedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  removed: { type: Boolean, default: false, index: true },
  createdBy: { type: String, required: true, index: true }
}, { timestamps: true });

export const QuoteModel = mongoose.model('Quote', QuoteSchema);