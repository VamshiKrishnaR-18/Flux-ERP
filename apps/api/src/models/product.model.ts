import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, default: 0 },
  sku: { type: String },
}, { timestamps: true });

export const ProductModel = mongoose.model('Product', productSchema);