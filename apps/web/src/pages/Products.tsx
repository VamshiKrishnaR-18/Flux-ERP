import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type ProductDTO, type Product } from '@erp/types';
import { Package, Plus, Pencil, Trash2, ArrowUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { useSortableData } from '../hooks/useSortableData';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const LIMIT = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1️⃣ Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 2️⃣ Fetch
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/products?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
      setProducts(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) { toast.error("Failed to load products"); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, debouncedSearch]);

  // Sort
  const { items: sortedProducts, requestSort, sortConfig } = useSortableData(products);
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  // Forms
  const { register, handleSubmit, reset  } = useForm<ProductDTO>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: { name: '', price: 0, stock: 0, description: '', sku: '' }
  });

  const onSubmit = async (data: ProductDTO) => {
    try {
      if (editingId) { await api.put(`/products/${editingId}`, data); toast.success("Updated"); } 
      else { await api.post('/products', data); toast.success("Added"); }
      setIsModalOpen(false); reset(); setEditingId(null); fetchProducts();
    } catch (err) { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete?")) {
      try { await api.delete(`/products/${id}`); toast.success("Deleted"); fetchProducts(); } 
      catch (err) { toast.error("Failed"); }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="w-6 h-6" /> Inventory</h1>
        <div className="flex items-center gap-3">
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none" />
             </div>
             <button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {isLoading ? <div className="p-12 text-center text-gray-500">Loading...</div> : 
         products.length === 0 ? <div className="p-12 text-center text-gray-500">No products found.</div> : (
          <>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold cursor-pointer select-none">
                <tr>
                  <th className="px-6 py-4" onClick={() => requestSort('name')}>Name <SortIcon column="name" /></th>
                  <th className="px-6 py-4" onClick={() => requestSort('sku')}>SKU <SortIcon column="sku" /></th>
                  <th className="px-6 py-4 text-right" onClick={() => requestSort('price')}>Price <SortIcon column="price" /></th>
                  <th className="px-6 py-4 text-right" onClick={() => requestSort('stock')}>Stock <SortIcon column="stock" /></th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">{p.sku || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right"><span className={`px-2 py-1 rounded-full text-xs ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock}</span></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingId(p._id); reset(p); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Modal code implied (same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
             <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'New Product'}</h2>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
               <div><label className="block text-sm font-medium mb-1">Name</label><input {...register('name')} className="w-full border p-2 rounded" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium mb-1">Price</label><input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full border p-2 rounded" /></div>
                 <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" {...register('stock', { valueAsNumber: true })} className="w-full border p-2 rounded" /></div>
               </div>
               <div><label className="block text-sm font-medium mb-1">SKU</label><input {...register('sku')} className="w-full border p-2 rounded" /></div>
               <div className="flex justify-end gap-2 mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}