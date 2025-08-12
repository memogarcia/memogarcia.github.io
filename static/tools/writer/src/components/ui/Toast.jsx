import React, { useEffect } from 'react';

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getVariantStyles = () => {
    switch (toast.variant) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-bg border border-border text-primary';
    }
  };

  return (
    <div className={`rounded-lg p-4 shadow-lg max-w-sm ${getVariantStyles()} transform transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {toast.title && (
            <div className="font-medium text-sm mb-1">
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}