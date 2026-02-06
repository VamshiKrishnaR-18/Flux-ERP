import { createContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('flux_user', JSON.stringify(userData));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('flux_user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser) {
                    setUser(parsedUser);
                }
            } catch (e) {
                console.error("Failed to parse user from storage", e);
                // Clean up bad data
                localStorage.removeItem('flux_user');
            }
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      setUser(data.data);
      // ✅ CRITICAL FIX: Save token so axios interceptor works
      localStorage.setItem('token', data.token); 
      localStorage.setItem('flux_user', JSON.stringify(data.data)); 
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch(e) { console.error(e); }
    setUser(null);
    localStorage.removeItem('flux_user');
    localStorage.removeItem('token'); // ✅ Clear token
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
