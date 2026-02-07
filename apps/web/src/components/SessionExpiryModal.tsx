import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function SessionExpiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth(); 

  useEffect(() => {
    const handleExpiry = () => setIsOpen(true);
    
    
    window.addEventListener('session-expired', handleExpiry);
    
    
    return () => window.removeEventListener('session-expired', handleExpiry);
  }, []);

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (user?.email) {
        
        await login(user.email, password);
        setIsOpen(false);
        setPassword('');
        toast.success("Session restored! You can now save your work.");
      } else {
        
        window.location.href = '/login';
      }
    } catch {
      toast.error("Incorrect password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Session Expired</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Your security session has timed out. Please re-enter your password to restore the connection and **save your work**.
          </p>
          
          <form onSubmit={handleReLogin} className="mt-6">
            <div className="text-left mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</span>
                <div className="text-sm font-medium text-gray-900">{user?.email}</div>
            </div>
            
            <input 
              type="password" 
              placeholder="Enter password to unlock"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2 focus:ring-2 focus:ring-red-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
              {isLoading ? 'Verifying...' : 'Restore Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}