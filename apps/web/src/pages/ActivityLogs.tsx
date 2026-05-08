import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { 
  Activity, 
  Calendar, 
  User, 
  FileText, 
  Users, 
  Package, 
  Receipt, 
  Settings, 
  FileCode,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  _id: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'paid' | 'sent' | 'converted';
  resourceType: 'Invoice' | 'Quote' | 'Client' | 'Product' | 'Expense' | 'Settings';
  resourceId: string;
  resourceName?: string;
  details?: string[];
  at: string;
}

const RESOURCE_ICONS: Record<string, any> = {
  Invoice: FileText,
  Quote: FileCode,
  Client: Users,
  Product: Package,
  Expense: Receipt,
  Settings: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  updated: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  deleted: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  paid: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  sent: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
  converted: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/activity?page=${page}&limit=${LIMIT}`);
      setLogs(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Activity Feed</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Track every action across your organization</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center gap-2">
           <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
           <span className="font-medium text-sm text-gray-700 dark:text-slate-200">{logs.length} Recent Events</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center">
            <Activity className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">No activity recorded yet</h3>
            <p className="text-gray-500 dark:text-slate-400">Actions will appear here as you use the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {logs.map((log) => {
              const Icon = RESOURCE_ICONS[log.resourceType] || Activity;
              return (
                <div key={log._id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-6">
                  <div className={`p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${ACTION_COLORS[log.action]}`}>
                        {log.action}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                        {log.resourceType} {log.resourceName && <span className="text-gray-400 dark:text-slate-500 ml-1">({log.resourceName})</span>}
                      </h4>
                    </div>

                    {log.details && log.details.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                        <ul className="list-disc list-inside space-y-1">
                          {log.details.map((detail, idx) => (
                            <li key={idx}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.at), 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        System User
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <button 
                       className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                       title="View Resource"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/20 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
