import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type ProductDTO, type Product } from '@erp/types';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { useProducts } from '../features/products/useProducts';

export default function Products() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductDTO>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: { name: '', price: 0, stock: 0, description: '', sku: '' }
  });

  const onSubmit = async (data: ProductDTO) => {
    if (editingId) {
      await updateProduct(editingId, data);
    } else {
      await addProduct(data);
    }
    setIsModalOpen(false);
    reset();
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product._id);
    reset({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      sku: product.sku || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this product?")) {
      await deleteProduct(id);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    reset({ name: '', price: 0, stock: 0, description: '', sku: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6" /> Inventory
        </h1>
        <button onClick={openNewModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No products found. Add one to get started.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {p.name}
                    {p.description && <p className="text-xs text-gray-400 font-normal">{p.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">{p.sku || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(p._id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input {...register('name')} className="w-full border p-2 rounded" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input type="number" {...register('stock', { valueAsNumber: true })} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU (Optional)</label>
                <input {...register('sku')} className="w-full border p-2 rounded" placeholder="PROD-001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea {...register('description')} className="w-full border p-2 rounded" rows={2} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}