import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { asyncHandler } from '../utils/asyncHandler';
import { productService } from '../services/product.service';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export const ProductController = {
  // Search + Pagination
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string || '';

    const { products, total } = await productService.getAllProducts(userId, { page, limit, search });

    res.json({ 
      success: true, 
      data: products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  }),

  
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await productService.createProduct(userId, req.body);
    res.status(201).json({ success: true, data: product });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await productService.updateProduct(String(req.params.id), userId, req.body);
    res.json({ success: true, data: product });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    await productService.deleteProduct(String(req.params.id), userId);
    res.json({ success: true, message: "Product deleted" });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const product = await ProductModel.findOne({ _id: req.params.id, createdBy: userId, removed: { $ne: true } });
    if (!product) { res.status(404); throw new Error("Product not found"); }
    res.json({ success: true, data: product });
  }),

  bulkImport: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) { res.status(400); throw new Error("No file uploaded"); }
    const userId = req.user?.id;
    if (!userId) { res.status(401); throw new Error("Unauthorized"); }

    const content = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const result = await productService.bulkImport(userId, records);

    res.json({ success: true, message: `Imported ${result.length} products` });
  })
};