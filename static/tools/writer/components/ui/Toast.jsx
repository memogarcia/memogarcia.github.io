// Toast.jsx - Toast notification system
const { useState, useEffect } = React;

// Toast Component
function Toast({ 
  toast, 
  onDismiss,
  className,
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  // Auto dismiss after duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Animation duration
  };

  const getToastStyles = () => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isRemoving ? 'translateX(100%)' : 'translateX(0)',
      opacity: isRemoving ? 0 : 1,
      maxWidth: '350px',
      wordWrap: 'break-word'
    };

    switch (toast.variant) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#10b981',
          color: 'white',
          borderColor: '#059669'
        };
      case 'error':
      case 'destructive':
        return {
          ...baseStyles,
          backgroundColor: '#ef4444',
          color: 'white',
          borderColor: '#dc2626'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#f59e0b',
          color: 'white',
          borderColor: '#d97706'
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        };
    }
  };

  if (!isVisible && !isRemoving) return null;

  return React.createElement(
    'div',
    {
      className: window.cn && window.cn('toast', className),
      style: getToastStyles(),
      onClick: handleDismiss,
      role: 'alert',
      'aria-live': 'assertive',
      'aria-atomic': 'true',
      ...props
    },
    // Close button
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px'
        }
      },
      React.createElement(
        'div',
        { style: { flex: 1 } },
        // Title
        toast.title && React.createElement(
          'div',
          {
            style: {
              fontWeight: '600',
              fontSize: '0.875rem',
              marginBottom: toast.description ? '4px' : 0
            }
          },
          toast.title
        ),
        // Description
        toast.description && React.createElement(
          'div',
          {
            style: {
              fontSize: '0.8125rem',
              opacity: 0.9,
              lineHeight: '1.4'
            }
          },
          toast.description
        )
      ),
      // Close button
      React.createElement(
        'button',
        {
          style: {
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.7,
            fontSize: '18px',
            lineHeight: 1,
            fontWeight: 'bold'
          },
          onClick: (e) => {
            e.stopPropagation();
            handleDismiss();
          },
          'aria-label': 'Close notification'
        },
        '×'
      )
    )
  );
}

// Toast Container Component
function ToastContainer({ toasts = [], onDismiss, position = 'bottom-right' }) {
  if (!toasts || toasts.length === 0) return null;

  const getContainerStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 2000,
      pointerEvents: 'none' // Allow clicks through empty areas
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '16px', left: '16px' };
      case 'top-right':
        return { ...baseStyles, top: '16px', right: '16px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '16px', left: '16px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '16px', right: '16px' };
    }
  };

  return React.createElement(
    'div',
    {
      className: 'toast-container',
      style: getContainerStyles(),
      'aria-live': 'polite',
      'aria-label': 'Notifications'
    },
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'auto' // Re-enable clicks for toast items
        }
      },
      toasts.map(toast => 
        React.createElement(Toast, {
          key: toast.id,
          toast,
          onDismiss
        })
      )
    )
  );
}

// Enhanced Toast Container (replaces the placeholder)
function EnhancedToastContainer({ toasts, onDismiss }) {
  return React.createElement(ToastContainer, {
    toasts,
    onDismiss,
    position: 'bottom-right'
  });
}

// Export components
window.Toast = Toast;
window.ToastContainer = EnhancedToastContainer;