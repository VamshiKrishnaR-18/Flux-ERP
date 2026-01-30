import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { ProductSchema } from '@erp/types';

export const ProductController = {
  // Get All
  getAll: async (req: Request, res: Response) => {
    try {
      const products = await ProductModel.find().sort({ createdAt: -1 });
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  },

  // Create
  create: async (req: Request, res: Response) => {
    try {
      const parsed = ProductSchema.parse(req.body); // Validate
      const product = await ProductModel.create(parsed);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, message: "Invalid product data" });
    }
  },

  // Update
  update: async (req: Request, res: Response) => {
    try {
      const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update product" });
    }
  },

  // Delete
  delete: async (req: Request, res: Response) => {
    try {
      await ProductModel.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete product" });
    }
  }
};