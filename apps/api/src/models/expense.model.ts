import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  amount: number;
  date: Date;
  category: string;
  notes?: string;
  attachments?: {
    name?: string;
    url?: string;
    type?: string;
    size?: number;
    uploadedAt?: Date;
  }[];
  removed: boolean;
  createdBy: string;
  createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now, index: true },
  
  
  category: { type: String, required: true, default: 'Operational', index: true },
  notes: { type: String },
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],
  removed: { type: Boolean, default: false, index: true },
  createdBy: { type: String, required: true, index: true }
}, { 
  timestamps: true 
});

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);