import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Toast as ToastType } from '../../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const icons = {
    default: null,
    success: <CheckCircle className="w-5 h-5 text-accent" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="bg-bg border border-border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md dark:shadow-xl"
    >
      <div className="flex items-start gap-3">
        {icons[toast.variant || 'default']}
        <div className="flex-1">
          <p className="font-medium text-primary">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-muted mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 hover:bg-hover rounded transition-colors"
        >
          <X className="w-4 h-4 text-secondary" />
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}