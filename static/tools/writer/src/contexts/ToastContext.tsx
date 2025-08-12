import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';

interface ToastContextType {
  toast: ReturnType<typeof useToast>['toast'];
  dismiss: ReturnType<typeof useToast>['dismiss'];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, dismiss } = useToast();

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}