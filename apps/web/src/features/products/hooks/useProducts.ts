import { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
// ✅ FIX: Use 'import type'
import type { ProductDTO, Product } from '@erp/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const addProduct = async (data: ProductDTO) => {
    await api.post('/products', data);
    toast.success("Product created");
    fetchProducts();
  };

  const updateProduct = async (id: string, data: ProductDTO) => {
    await api.put(`/products/${id}`, data);
    toast.success("Product updated");
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    toast.success("Product deleted");
    fetchProducts();
  };

  return { 
    products, 
    isLoading, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  };
}