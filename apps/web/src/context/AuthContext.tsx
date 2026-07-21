import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  dashboardConfig?: string[];
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  updateDashboardConfig: (config: string[]) => Promise<void>;
  updateUser: (user: User) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardConfig, setDashboardConfig] = useState<string[]>(["stats", "cashflow", "aging", "recentInvoices", "topClients"]);
  const navigate = useNavigate();

  useEffect(() => {
    setUser({
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@flux-erp.com',
      role: 'user',
      dashboardConfig: dashboardConfig,
    });
    setIsLoading(false);
  }, [dashboardConfig]);

  const logout = () => {
    navigate('/');
  };

  const updateDashboardConfig = async (config: string[]) => {
    setDashboardConfig(config);
    setUser(prev => prev ? { ...prev, dashboardConfig: config } : null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, logout, updateDashboardConfig, updateUser, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}