import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true, default: 'My Company' },
  companyEmail: { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  taxId: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  updatedAt: { type: Date, default: Date.now }
});

export const SettingsModel = mongoose.model('Settings', settingsSchema);