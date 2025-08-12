/**
 * Toast Hook - Notification system
 * Converted from TypeScript to JavaScript
 */

const { useState, useCallback } = React;

/**
 * @typedef {Object} Toast
 * @property {string} id - Unique identifier
 * @property {string} title - Toast title
 * @property {string} [description] - Optional description
 * @property {'default'|'success'|'error'} [variant] - Toast variant
 */

/**
 * Custom hook for managing toast notifications
 * @returns {Object} Toast management functions
 */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((toastData) => {
    const id = Date.now().toString();
    const newToast = { ...toastData, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

// Make available globally
window.useToast = useToast;