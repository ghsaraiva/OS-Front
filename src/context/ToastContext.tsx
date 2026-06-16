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
      <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-fade-in-right
              ${toast.type === 'success' ? 'border-success-500 bg-success-50 dark:bg-success-500/15' : ''}
              ${toast.type === 'error' ? 'border-error-500 bg-error-50 dark:bg-error-500/15' : ''}
              ${toast.type === 'warning' ? 'border-warning-500 bg-warning-50 dark:bg-warning-500/15' : ''}
              ${toast.type === 'info' ? 'border-blue-light-500 bg-blue-light-50 dark:bg-blue-light-500/15' : ''}
            `}
          >
            <div className={`mt-0.5 
              ${toast.type === 'success' ? 'text-success-500' : ''}
              ${toast.type === 'error' ? 'text-error-500' : ''}
              ${toast.type === 'warning' ? 'text-warning-500' : ''}
              ${toast.type === 'info' ? 'text-blue-light-500' : ''}
            `}>
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <XCircle size={20} />}
              {toast.type === 'warning' && <AlertTriangle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {toast.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {toast.message}
              </p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
