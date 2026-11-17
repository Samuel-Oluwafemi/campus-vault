import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToast({ id, message });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => current?.id === toast.id ? null : current);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-icon" aria-hidden="true">✓</span>
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}
