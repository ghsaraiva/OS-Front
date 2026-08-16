import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:top-5 z-[1000000] flex flex-col gap-2.5 pointer-events-none w-auto sm:w-full sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slideDown sm:animate-fade-in-right
              ${
                toast.type === 'success'
                  ? 'border-success-500/40 bg-white/95 text-gray-800 dark:bg-gray-900/95 dark:border-success-500/40 dark:text-white'
                  : ''
              }
              ${
                toast.type === 'error'
                  ? 'border-error-500/40 bg-white/95 text-gray-800 dark:bg-gray-900/95 dark:border-error-500/40 dark:text-white'
                  : ''
              }
              ${
                toast.type === 'warning'
                  ? 'border-warning-500/40 bg-white/95 text-gray-800 dark:bg-gray-900/95 dark:border-warning-500/40 dark:text-white'
                  : ''
              }
              ${
                toast.type === 'info'
                  ? 'border-brand-500/40 bg-white/95 text-gray-800 dark:bg-gray-900/95 dark:border-brand-500/40 dark:text-white'
                  : ''
              }
            `}
          >
            <div
              className={`mt-0.5 shrink-0 p-1.5 rounded-xl
              ${toast.type === 'success' ? 'bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-400' : ''}
              ${toast.type === 'error' ? 'bg-error-50 text-error-600 dark:bg-error-500/20 dark:text-error-400' : ''}
              ${toast.type === 'warning' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400' : ''}
              ${toast.type === 'info' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : ''}
            `}
            >
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {toast.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
