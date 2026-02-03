import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { ProductSchema } from '@erp/types';
import { asyncHandler } from '../utils/asyncHandler'; // ✅ Import

export const ProductController = {
  // Get All
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  }),

  // Create
  create: asyncHandler(async (req: Request, res: Response) => {
    const parsed = ProductSchema.safeParse(req.body); 
    if (!parsed.success) {
        res.status(400);
        throw new Error("Invalid product data");
    }
    const product = await ProductModel.create(parsed.data);
    res.status(201).json({ success: true, data: product });
  }),

  // Update
  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    res.json({ success: true, data: product });
  }),

  // Delete
  delete: asyncHandler(async (req: Request, res: Response) => {
    await ProductModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  })
};