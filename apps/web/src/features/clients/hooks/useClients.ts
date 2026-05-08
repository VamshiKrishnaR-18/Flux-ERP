import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Client } from '../types';

export function useClients() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [portalLoadingId, setPortalLoadingId] = useState<string | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['clients', page, debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/clients?page=${page}&limit=10&search=${debouncedSearch}`);
      return res.data;
    }
  });

  const clients = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const createClient = useMutation({
    mutationFn: (newClient: any) => api.post('/clients', newClient),
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previous = queryClient.getQueryData(['clients', page, debouncedSearch]);
      queryClient.setQueryData(['clients', page, debouncedSearch], (old: any) => ({
        ...old,
        data: [{ _id: 'temp-' + Date.now(), ...newClient, status: 'active' }, ...(old?.data || [])]
      }));
      return { previous };
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(['clients', page, debouncedSearch], context?.previous);
      toast.error("Failed to add client");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    onSuccess: () => toast.success("Client added")
  });

  const updateClient = useMutation({
    mutationFn: (args: { id: string, data: any }) => api.put(`/clients/${args.id}`, args.data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previous = queryClient.getQueryData(['clients', page, debouncedSearch]);
      queryClient.setQueryData(['clients', page, debouncedSearch], (old: any) => ({
        ...old,
        data: old?.data?.map((c: Client) => c._id === id ? { ...c, ...data } : c)
      }));
      return { previous };
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(['clients', page, debouncedSearch], context?.previous);
      toast.error("Failed to update client");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    onSuccess: () => toast.success("Client updated")
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previous = queryClient.getQueryData(['clients', page, debouncedSearch]);
      queryClient.setQueryData(['clients', page, debouncedSearch], (old: any) => ({
        ...old,
        data: old?.data?.filter((c: Client) => c._id !== id)
      }));
      return { previous };
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(['clients', page, debouncedSearch], context?.previous);
      toast.error("Failed to delete client");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    onSuccess: () => toast.success("Client deleted")
  });

  const generatePortalLink = async (id: string) => {
    setPortalLoadingId(id);
    try {
      const res = await api.get(`/clients/${id}/portal`);
      const token = res.data?.data?.token;
      if (!token) throw new Error('No token');
      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Portal link copied to clipboard');
    } catch {
      toast.error('Failed to generate portal link');
    } finally {
      setPortalLoadingId(null);
    }
  };

  return {
    clients,
    loading,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    createClient: createClient.mutate,
    updateClient: (id: string, data: any) => updateClient.mutate({ id, data }),
    deleteClient: deleteClient.mutate,
    generatePortalLink,
    portalLoadingId
  };
}
