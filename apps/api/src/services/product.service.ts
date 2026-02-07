import { ProductModel } from '../models/product.model';

export const ProductService = {
  
  /**
   * Adjusts stock levels for a list of invoice items.
   * @param items The array of items from the invoice
   * @param action 'deduct' (for creating invoices) or 'restore' (for deleting/cancelling)
   * @param userId The current user ID for tenant scoping
   */
  adjustStock: async (items: any[], action: 'deduct' | 'restore', userId?: string) => {
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
      } else {
        console.log(`⚠️ SKIP: Could not find product for "${item.itemName}"`);
      }
    }
    console.log("--- END STOCK ADJUSTMENT ---");
  }
};
