import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Define the shape of our API response
export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalClients: number;
  recentInvoices: any[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  // Hardcoded Chart Data (Ideally this comes from API too)
  const revenueData = [
    { name: 'Sep', income: 4000, expense: 2400 },
    { name: 'Oct', income: 3000, expense: 1398 },
    { name: 'Nov', income: 2000, expense: 5800 },
    { name: 'Dec', income: 2780, expense: 3908 },
    { name: 'Jan', income: 1890, expense: 4800 },
    { name: 'Feb', income: 2390, expense: 3800 },
    { name: 'Mar', income: 3490, expense: 4300 },
  ];

  // Dynamic Status Data based on fetched stats
  const statusData = [
    { name: 'Paid', value: stats ? (stats.totalInvoices - stats.pendingInvoices) : 0, color: '#8B5CF6' },
    { name: 'Pending', value: stats?.pendingInvoices || 0, color: '#F59E0B' },
    { name: 'Overdue', value: 2, color: '#EF4444' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/dashboard?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data.data);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  return { 
    stats, 
    isLoading, 
    revenueData, 
    statusData 
  };
}