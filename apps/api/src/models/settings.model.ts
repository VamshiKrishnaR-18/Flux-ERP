
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  userId: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
  defaultPaymentTerms: number;
  defaultNotes: string;
}

const SettingsSchema: Schema = new Schema({
  userId: { type: String, required: true },
  companyName: { type: String, required: true, default: 'My Company' },
  companyEmail: { type: String },
  companyPhone: { type: String },
  companyAddress: { type: String },
  companyWebsite: { type: String },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 0 },
  invoicePrefix: { type: String, default: 'INV-' },
  invoiceStartNumber: { type: Number, default: 1000 },
  defaultPaymentTerms: { type: Number, default: 14 },
  defaultNotes: { type: String }
}, { timestamps: true });

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);