import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  userId: string; // If you want per-user settings
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  currency: string;
  taxRate: number;
}

const SettingsSchema: Schema = new Schema({
  userId: { type: String, required: true }, // Links settings to the logged-in user
  companyName: { type: String, required: true, default: 'My Company' },
  companyEmail: { type: String },
  companyPhone: { type: String },
  companyAddress: { type: String },
  companyWebsite: { type: String },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 0 }
}, { timestamps: true });

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);