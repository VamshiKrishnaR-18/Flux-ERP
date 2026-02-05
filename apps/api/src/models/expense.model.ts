import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  amount: number;
  date: Date;
  category: string;
  createdBy: string;
  createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  
  // ✅ FIX: Remove 'enum: [...]' if it exists. Just use type: String.
  category: { type: String, required: true, default: 'Operational' },

  // Multi-tenant scoping
  createdBy: { type: String, required: true, index: true }
}, { 
  timestamps: true 
});

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);