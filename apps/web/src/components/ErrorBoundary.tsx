import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-rose-50/50 dark:bg-rose-500/5 rounded-3xl border border-rose-100 dark:border-rose-500/10 animate-in fade-in duration-300">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-xs mb-6">
            We encountered an error while rendering this section. Try refreshing or contact support if the problem persists.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
