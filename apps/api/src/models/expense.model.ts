import mongoose, { Schema, Document } from 'mongoose';
import { Expense as IExpenseDTO } from "@erp/types";

export interface IExpenseDocument extends Document, Omit<IExpenseDTO, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['office', 'software', 'marketing', 'travel', 'salary', 'utilities', 'other'],
    default: 'other' 
  },
  date: { type: Date, required: true, default: Date.now },
  receipt: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

export const ExpenseModel = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);