import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  createdBy: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  sku: { type: String, index: true },
  removed: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const ProductModel = mongoose.model('Product', productSchema);
