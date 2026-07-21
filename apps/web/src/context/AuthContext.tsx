import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useDemoMode } from './DemoModeContext';

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

// Demo mode provider (no Clerk)
function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoDashboardConfig, setDemoDashboardConfig] = useState<string[]>(["stats", "cashflow", "aging", "recentInvoices", "topClients"]);
  const navigate = useNavigate();

  useEffect(() => {
    setUser({
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@flux-erp.com',
      role: 'user',
      dashboardConfig: demoDashboardConfig,
    });
    setIsLoading(false);
  }, [demoDashboardConfig]);

  const logout = () => {
    navigate('/');
  };

  const updateDashboardConfig = async (config: string[]) => {
    setDemoDashboardConfig(config);
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

// Clerk auth provider
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Axios Interceptor to inject Clerk Token
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken({ template: 'flux-erp' });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, [getToken]);

  useEffect(() => {
    if (isUserLoaded) {
      if (isSignedIn && clerkUser) {
        setUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata.role as string) || 'user',
          dashboardConfig: (clerkUser.unsafeMetadata.dashboardConfig as string[]) || ["stats", "cashflow", "aging", "recentInvoices", "topClients"],
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [clerkUser, isUserLoaded, isSignedIn]);

  const logout = async () => {
    await signOut();
    setUser(null);
    navigate('/login');
  };

  const updateDashboardConfig = async (config: string[]) => {
    if (!clerkUser) return;
    await clerkUser.update({
      unsafeMetadata: {
        ...clerkUser.unsafeMetadata,
        dashboardConfig: config,
      },
    });
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}