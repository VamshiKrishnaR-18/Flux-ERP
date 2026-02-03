import { useState, useEffect } from 'react';
import { api } from '../../lib/axios'; // ✅ Using shared API
import { toast } from 'sonner';

// Define the shape of our API response
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  totalInvoices: number;
  pendingInvoices: number;
  pendingAmount: number;
  totalClients: number;
  trendPercentage: number;
  recentInvoices: any[];
  // ✅ NEW: Add chart structure
  chartData: { 
    name: string; 
    income: number; 
    expense: number; 
  }[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Status Data based on fetched stats
  const statusData = [
    { name: 'Paid', value: stats ? (stats.totalInvoices - stats.pendingInvoices) : 0, color: '#8B5CF6' },
    { name: 'Pending', value: stats?.pendingInvoices || 0, color: '#F59E0B' },
    { name: 'Overdue', value: 0, color: '#EF4444' }, // We can make this real later too
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/dashboard?t=${Date.now()}`);
        setStats(response.data.data);
      } catch (error) {
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
    // ✅ FIX: Use Real Data, or fallback to empty array
    revenueData: stats?.chartData || [], 
    statusData 
  };
}