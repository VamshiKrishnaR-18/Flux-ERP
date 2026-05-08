import { ProductModel } from '../models/product.model';
import { EmailService, emailService } from './email.service';
import { SettingsModel } from '../models/settings.model';
import { logActivity } from '../utils/activity';
import { ProductSchema } from '@erp/types';

export class ProductService {
  constructor(private emailService: EmailService) {}

  async getAllProducts(userId: string, params: { page: number; limit: number; search: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const query: any = { createdBy: userId, removed: { $ne: true } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProductModel.countDocuments(query)
    ]);

    return { products, total };
  }

  async createProduct(userId: string, data: any) {
    const parsed = ProductSchema.safeParse(data);
    if (!parsed.success) throw new Error("Invalid data");

    const product = await ProductModel.create({ ...parsed.data, createdBy: userId });

    await logActivity({
      userId: String(userId),
      action: 'created',
      resourceType: 'Product',
      resourceId: String(product._id),
      resourceName: product.name as string
    });

    return product;
  }

  async updateProduct(id: string, userId: string, data: any) {
    const product = await ProductModel.findOneAndUpdate(
      { _id: id, createdBy: userId },
      data,
      { new: true }
    );
    if (!product) throw new Error("Product not found");

    await logActivity({
      userId: String(userId),
      action: 'updated',
      resourceType: 'Product',
      resourceId: String(product._id),
      resourceName: product.name as string,
      details: Object.keys(data)
    });

    return product;
  }

  async deleteProduct(id: string, userId: string) {
    const product = await ProductModel.findOne({ _id: id, createdBy: userId, removed: { $ne: true } });
    if (!product) throw new Error("Product not found");

    product.removed = true;
    await product.save();

    await logActivity({
      userId: String(userId),
      action: 'deleted',
      resourceType: 'Product',
      resourceId: String(product._id),
      resourceName: product.name as string
    });

    return true;
  }

  async bulkImport(userId: string, records: any[]) {
    const productsToCreate = records.map((r: any) => ({
      createdBy: userId,
      name: r.name || r.Name,
      description: r.description || r.Description,
      price: Number(r.price || r.Price || 0),
      stock: Number(r.stock || r.Stock || 0),
      minStock: Number(r.minStock || r.MinStock || 5),
      sku: r.sku || r.SKU
    })).filter((p: any) => p.name);

    const result = await ProductModel.insertMany(productsToCreate);

    await logActivity({
      userId: String(userId),
      action: 'created',
      resourceType: 'Product',
      resourceId: 'bulk',
      resourceName: `Bulk Import (${result.length} products)`
    });

    return result;
  }

  /**
   * Adjusts stock levels for a list of invoice items.
   * @param items The array of items from the invoice
   * @param action 'deduct' (for creating invoices) or 'restore' (for deleting/cancelling)
   * @param userId The current user ID for tenant scoping
   */
  async adjustStock(items: any[], action: 'deduct' | 'restore', userId?: string) {
    console.log(`--- STARTING STOCK ${action.toUpperCase()} ---`);
    const multiplier = action === 'deduct' ? -1 : 1;

    for (const item of items) {
      const quantityChange = item.quantity * multiplier;
      let updatedProduct;

      if (item.productId) {
        const idQuery = userId
          ? { _id: item.productId, createdBy: userId }
          : { _id: item.productId };
        updatedProduct = await ProductModel.findOneAndUpdate(
          idQuery,
          { $inc: { stock: quantityChange } },
          { new: true }
        );
      }

      if (!updatedProduct && item.itemName && userId) {
        const cleanName = item.itemName.trim();
        updatedProduct = await ProductModel.findOneAndUpdate(
          { name: cleanName, createdBy: userId },
          { $inc: { stock: quantityChange } },
          { new: true }
        );
      }

      if (updatedProduct) {
        console.log(`✅ ${action.toUpperCase()}: "${updatedProduct.name}" stock now ${updatedProduct.stock}`);
        
        // Check for Low Stock
        const p = updatedProduct as any;
        if (p.stock <= p.minStock && action === 'deduct') {
           const settings = await SettingsModel.findOne({ userId: p.createdBy });
           if (settings?.companyEmail) {
              await this.emailService.sendInventoryAlert(p, settings.companyEmail);
           }
        }
      } else {
        console.log(`⚠️ SKIP: Could not find product for "${item.itemName}"`);
      }
    }
    console.log("--- END STOCK ADJUSTMENT ---");
  }
}

export const productService = new ProductService(emailService);