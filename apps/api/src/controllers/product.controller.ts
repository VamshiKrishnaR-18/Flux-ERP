import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { ProductSchema } from '../shared/types';
import { asyncHandler } from '../utils/asyncHandler';

export const ProductController = {
  // ✅ UPDATED: Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const query: any = { createdBy: userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await ProductModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductModel.countDocuments(query);

    res.json({ 
      success: true, 
      data: products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  }),

  // ... (Keep create, update, delete as is)
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const parsed = ProductSchema.safeParse(req.body); 
    if (!parsed.success) { res.status(400); throw new Error("Invalid data"); }
    const product = await ProductModel.create({ ...parsed.data, createdBy: userId });
    res.status(201).json({ success: true, data: product });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await ProductModel.findOneAndUpdate(
      { _id: req.params.id, createdBy: userId },
      req.body,
      { new: true }
    );
    if (!product) { res.status(404); throw new Error("Product not found"); }
    res.json({ success: true, data: product });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await ProductModel.findOneAndDelete({ _id: req.params.id, createdBy: userId });
    if (!product) { res.status(404); throw new Error("Product not found"); }
    res.json({ success: true, message: "Product deleted" });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await ProductModel.findOne({ _id: req.params.id, createdBy: userId });
    if (!product) { res.status(404); throw new Error("Product not found"); }
    res.json({ success: true, data: product });
  })
};
