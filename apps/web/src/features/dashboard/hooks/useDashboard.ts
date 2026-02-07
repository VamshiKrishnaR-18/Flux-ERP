import { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';


export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  totalInvoices: number;
  pendingInvoices: number;
  pendingAmount: number;
  totalClients: number;
  trendPercentage: number;
  recentInvoices: Record<string, unknown>[];
  
  chartData: { 
    name: string; 
    income: number; 
    expense: number; 
  }[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  const statusData = [
    { name: 'Paid', value: stats ? (stats.totalInvoices - stats.pendingInvoices) : 0, color: '#8B5CF6' },
    { name: 'Pending', value: stats?.pendingInvoices || 0, color: '#F59E0B' },
    { name: 'Overdue', value: 0, color: '#EF4444' }, 
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/dashboard?t=${Date.now()}`);
        setStats(response.data.data);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { 
    stats, 
    isLoading, 
    
    revenueData: stats?.chartData || [], 
    statusData 
  };
}