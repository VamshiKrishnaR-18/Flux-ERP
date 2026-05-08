import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Plus, Pencil, Trash2, ArrowUpDown, Search, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { useSortableData } from '../hooks/useSortableData';
import { EmptyState } from '../components/EmptyState'; 
import { StatusBadge } from '../components/StatusBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Product, type ProductDTO, ProductSchema } from '@erp/types';
import { TableSkeleton } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { InlineEdit } from '../components/InlineEdit';

type Density = 'compact' | 'relaxed';

const LIMIT = 10;

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>('relaxed');
  const [isImporting, setIsImporting] = useState(false);

  // Fetch Products
  const { data, isLoading } = useQuery<{ data: Product[]; pagination: { totalPages: number } }>({
    queryKey: ['products', page, debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/products?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
      return res.data;
    }
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newProduct: ProductDTO) => api.post('/products', newProduct),
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousProducts = queryClient.getQueryData(['products', page, debouncedSearch]);
      
      queryClient.setQueryData(['products', page, debouncedSearch], (old: any) => ({
        ...old,
        data: [{ _id: 'temp-' + Date.now(), ...newProduct, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...(old?.data || [])]
      }));

      return { previousProducts };
    },
    onError: (_err, _newProduct, context) => {
      queryClient.setQueryData(['products', page, debouncedSearch], context?.previousProducts);
      toast.error("Failed to add product");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onSuccess: () => toast.success("Product added")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductDTO> }) => api.put(`/products/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousProducts = queryClient.getQueryData(['products', page, debouncedSearch]);

      queryClient.setQueryData(['products', page, debouncedSearch], (old: any) => ({
        ...old,
        data: old?.data?.map((p: Product) => p._id === id ? { ...p, ...data } : p)
      }));

      return { previousProducts };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['products', page, debouncedSearch], context?.previousProducts);
      toast.error("Failed to update product");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onSuccess: () => toast.success("Product updated")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousProducts = queryClient.getQueryData(['products', page, debouncedSearch]);

      queryClient.setQueryData(['products', page, debouncedSearch], (old: any) => ({
        ...old,
        data: old?.data?.filter((p: Product) => p._id !== id)
      }));

      return { previousProducts };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['products', page, debouncedSearch], context?.previousProducts);
      toast.error("Failed to delete product");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onSuccess: () => toast.success("Product deleted")
  });

  const handleBulkImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsImporting(true);
    try {
      await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Products imported successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Sort
  const { items: sortedProducts, requestSort, sortConfig } = useSortableData<Product>(products);
  const SortIcon = ({ column }: { column: keyof Product }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  // Form
  const { register, handleSubmit, reset } = useForm<ProductDTO>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: { name: '', price: 0, stock: 0, description: '', sku: '', minStock: 5 }
  });

  const onSubmit = (data: ProductDTO) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
    setIsModalOpen(false);
    reset();
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsImporting(true);
    try {
      await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Products imported successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      toast.error('Failed to import products');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Products</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your inventory and stock levels</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setDensity('compact')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === 'compact' ? 'bg-black dark:bg-slate-100 text-white dark:text-slate-900' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('relaxed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === 'relaxed' ? 'bg-black dark:bg-slate-100 text-white dark:text-slate-900' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Relaxed
            </button>
          </div>
          <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search name or SKU..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg outline-none text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20" 
                />
             </div>

             <label className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={isImporting} />
             </label>

             <button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton cols={6} rows={LIMIT} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th onClick={() => requestSort('name')} className={`px-6 text-xs uppercase tracking-wider font-semibold cursor-pointer group ${density === 'compact' ? 'py-3' : 'py-5'}`}>
                    Product Name <SortIcon column="name" />
                  </th>
                  <th onClick={() => requestSort('sku')} className={`px-6 text-xs uppercase tracking-wider font-semibold cursor-pointer group ${density === 'compact' ? 'py-3' : 'py-5'}`}>
                    SKU <SortIcon column="sku" />
                  </th>
                  <th onClick={() => requestSort('price')} className={`px-6 text-xs uppercase tracking-wider font-semibold cursor-pointer group ${density === 'compact' ? 'py-3' : 'py-5'}`}>
                    Price <SortIcon column="price" />
                  </th>
                  <th onClick={() => requestSort('stock')} className={`px-6 text-xs uppercase tracking-wider font-semibold cursor-pointer group ${density === 'compact' ? 'py-3' : 'py-5'}`}>
                    Inventory <SortIcon column="stock" />
                  </th>
                  <th className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === 'compact' ? 'py-3' : 'py-5'}`}>Status</th>
                  <th className={`px-6 text-xs uppercase tracking-wider font-semibold text-right ${density === 'compact' ? 'py-3' : 'py-5'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState 
                        title="Your catalog is empty"
                        description="Add your products or services to easily include them in invoices later. You can also bulk import them from CSV."
                        icon={Package}
                        actionLabel="Add Product"
                        onAction={() => setIsModalOpen(true)}
                        stepNumber={2}
                        secondaryActionLabel="Bulk Import"
                        onSecondaryAction={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv';
                          input.onchange = (e) => {
                             const file = (e.target as HTMLInputElement).files?.[0];
                             if (file) handleBulkImport(file);
                          };
                          input.click();
                        }}
                      />
                    </td>
                  </tr>
                ) : sortedProducts.map((p) => (
                  <tr key={p._id} className="group hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all duration-200">
                    <td className={`px-6 ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-slate-100 font-bold">{p.name}</span>
                        {density === 'relaxed' && <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[200px]">{p.description}</span>}
                      </div>
                    </td>
                    <td className={`px-6 text-gray-600 dark:text-slate-400 font-mono text-xs ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                      {p.sku || <span className="text-gray-300 dark:text-slate-700">N/A</span>}
                    </td>
                    <td className={`px-6 ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                      <span className="text-gray-900 dark:text-slate-100 font-bold">${p.price.toFixed(2)}</span>
                    </td>
                    <td className={`px-6 ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${p.stock > p.minStock ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                           <div className="w-24">
                              <InlineEdit 
                                value={p.stock} 
                                type="number"
                                onSave={async (val) => {
                                  await updateMutation.mutateAsync({ id: p._id, data: { ...p, stock: Number(val) } });
                                }}
                                className="font-semibold text-gray-700 dark:text-slate-300"
                              />
                           </div>
                        </div>
                      </td>
                    <td className={`px-6 ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                      <StatusBadge status={p.stock > (p as any).minStock ? 'active' : p.stock > 0 ? 'pending' : 'overdue'} />
                    </td>
                    <td className={`px-6 text-right ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingId(p._id); reset(p); setIsModalOpen(true); }} className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-slate-400">
                Page <span className="font-medium text-gray-900 dark:text-slate-100">{page}</span> of <span className="font-medium text-gray-900 dark:text-slate-100">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
             <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">{editingId ? 'Edit Product' : 'New Product'}</h2>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
               <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Name</label><input {...register('name')} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
               <div className="grid grid-cols-3 gap-4">
                 <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Price</label><input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                 <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Stock</label><input type="number" {...register('stock', { valueAsNumber: true })} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                 <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Min. Stock</label><input type="number" {...register('minStock', { valueAsNumber: true })} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="5" /></div>
               </div>
               <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">SKU</label><input {...register('sku')} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
               <div className="flex justify-end gap-2 mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded font-medium transition-colors">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
