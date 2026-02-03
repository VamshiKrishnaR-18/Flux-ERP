import { ProductModel } from '../models/product.model';

export const ProductService = {
  
  /**
   * Adjusts stock levels for a list of invoice items.
   * @param items The array of items from the invoice
   * @param action 'deduct' (for creating invoices) or 'restore' (for deleting/cancelling)
   */
  adjustStock: async (items: any[], action: 'deduct' | 'restore') => {
    console.log(`--- STARTING STOCK ${action.toUpperCase()} ---`);
    const multiplier = action === 'deduct' ? -1 : 1;

    for (const item of items) {
      const quantityChange = item.quantity * multiplier;
      let updatedProduct;

      // 1. Try to find by ID (Most Reliable)
      if (item.productId) {
        updatedProduct = await ProductModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: quantityChange } },
          { new: true }
        );
      }

      // 2. Fallback: Find by Name
      if (!updatedProduct && item.itemName) {
        const cleanName = item.itemName.trim();
        updatedProduct = await ProductModel.findOneAndUpdate(
          { name: cleanName },
          { $inc: { stock: quantityChange } },
          { new: true }
        );
      }

      // Log result
      if (updatedProduct) {
        console.log(`✅ ${action.toUpperCase()}: "${updatedProduct.name}" stock now ${updatedProduct.stock}`);
      } else {
        console.log(`⚠️ SKIP: Could not find product for "${item.itemName}"`);
      }
    }
    console.log("--- END STOCK ADJUSTMENT ---");
  }
};