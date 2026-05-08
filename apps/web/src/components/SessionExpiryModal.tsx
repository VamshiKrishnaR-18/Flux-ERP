import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClerk } from '@clerk/clerk-react';
import { Lock } from 'lucide-react';

export function SessionExpiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { openSignIn } = useClerk();

  useEffect(() => {
    const handleExpiry = () => setIsOpen(true);
    
    
    window.addEventListener('session-expired', handleExpiry);
    
    
    return () => window.removeEventListener('session-expired', handleExpiry);
  }, []);

  const handleReLogin = () => {
    openSignIn();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Session Expired</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Your security session has timed out. Please re-enter your password to restore the connection and **save your work**.
          </p>
          
          <div className="mt-6">
            <div className="text-left mb-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">Account</span>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{user?.email}</div>
            </div>
            
            <button 
              onClick={handleReLogin}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              Restore Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}