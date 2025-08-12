// Tabs.jsx - Simple tabs implementation
const { useState, createContext, useContext, useEffect } = React;

const TabsContext = createContext(null);

// Main Tabs Container
function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const contextValue = {
    value: currentValue,
    onValueChange: handleValueChange
  };

  return React.createElement(
    TabsContext.Provider,
    { value: contextValue },
    React.createElement(
      'div',
      {
        className: window.cn && window.cn('tabs-container', className),
        ...props
      },
      children
    )
  );
}

// Tabs List (the buttons container)
function TabsList({ className, children, ...props }) {
  return React.createElement(
    'div',
    {
      className: window.cn && window.cn(
        'tabs-list',
        'flex items-center justify-start bg-background-secondary rounded-lg p-1 border border-border',
        className
      ),
      role: 'tablist',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'var(--background-secondary)',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid var(--border)',
        gap: '2px'
      },
      ...props
    },
    children
  );
}

// Tab Trigger (individual tab button)
function TabsTrigger({ value, className, children, disabled, ...props }) {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const isActive = context.value === value;
  
  const handleClick = () => {
    if (!disabled) {
      context.onValueChange(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        context.onValueChange(value);
      }
    }
  };

  return React.createElement(
    'button',
    {
      type: 'button',
      className: window.cn && window.cn(
        'tab-trigger',
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        isActive 
          ? 'bg-background text-text-primary shadow-sm' 
          : 'text-text-secondary hover:text-text-primary hover:bg-background/50',
        className
      ),
      style: {
        padding: '6px 12px',
        fontSize: '0.875rem',
        fontWeight: '500',
        borderRadius: '6px',
        transition: 'all 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        backgroundColor: isActive ? 'var(--background)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
        opacity: disabled ? 0.5 : 1,
        ...(props.style || {})
      },
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      disabled,
      role: 'tab',
      'aria-selected': isActive,
      'aria-controls': `tabpanel-${value}`,
      tabIndex: isActive ? 0 : -1,
      ...props
    },
    children
  );
}

// Tab Content (the panel)
function TabsContent({ value, className, children, ...props }) {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const isActive = context.value === value;
  
  if (!isActive) {
    return null;
  }

  return React.createElement(
    'div',
    {
      className: window.cn && window.cn(
        'tab-content',
        'mt-4 focus:outline-none',
        className
      ),
      style: {
        marginTop: '16px',
        outline: 'none',
        ...(props.style || {})
      },
      role: 'tabpanel',
      id: `tabpanel-${value}`,
      'aria-labelledby': `tab-${value}`,
      tabIndex: 0,
      ...props
    },
    children
  );
}

// Export components
window.Tabs = Tabs;
window.TabsList = TabsList;
window.TabsTrigger = TabsTrigger;
window.TabsContent = TabsContent;