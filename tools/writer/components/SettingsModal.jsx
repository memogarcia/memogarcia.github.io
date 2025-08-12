// SettingsModal.jsx - Settings modal with theme, typography, and keyboard shortcuts
const { useState, useEffect } = React;

// Simple icon components
const CloseIcon = () => React.createElement('span', null, '✕');
const SettingsIcon = () => React.createElement('span', null, '⚙️');
const PaletteIcon = () => React.createElement('span', null, '🎨');
const TypeIcon = () => React.createElement('span', null, '📝');
const KeyboardIcon = () => React.createElement('span', null, '⌨️');
const InfoIcon = () => React.createElement('span', null, 'ℹ️');

/**
 * SettingsModal Component
 * Modal dialog with tabs for theme, typography, shortcuts, and about
 */
function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('writer-settings');
    return saved ? JSON.parse(saved) : {
      theme: 'system',
      fontFamily: 'system',
      fontSize: 16,
      lineHeight: 1.6
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('writer-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.body.classList.add('dark');
      localStorage.setItem('pref-theme', 'dark');
    } else if (settings.theme === 'light') {
      document.body.classList.remove('dark');
      localStorage.setItem('pref-theme', 'light');
    } else {
      // System theme
      document.body.classList.remove('dark');
      localStorage.removeItem('pref-theme');
    }
  }, [settings.theme]);

  // Apply typography settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Font family
    const fontFamilies = {
      system: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, Times, "Times New Roman", serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace'
    };
    
    root.style.setProperty('--editor-font-family', fontFamilies[settings.fontFamily] || fontFamilies.system);
    root.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--editor-line-height', settings.lineHeight);
  }, [settings.fontFamily, settings.fontSize, settings.lineHeight]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
    { id: 'typography', label: 'Typography', icon: TypeIcon },
    { id: 'shortcuts', label: 'Shortcuts', icon: KeyboardIcon },
    { id: 'about', label: 'About', icon: InfoIcon }
  ];

  return React.createElement(
    'div',
    {
      className: 'settings-overlay',
      style: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      },
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }
    },
    React.createElement(
      'div',
      {
        className: 'settings-dialog',
        style: {
          backgroundColor: 'var(--background)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideIn 0.2s ease-out'
        },
        onClick: (e) => e.stopPropagation()
      },
      
      // Header
      React.createElement(
        'header',
        {
          style: {
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        },
        React.createElement(
          'h2',
          {
            style: {
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }
          },
          React.createElement(SettingsIcon),
          'Settings'
        ),
        React.createElement(
          'button',
          {
            onClick: onClose,
            style: {
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              fontSize: '16px',
              transition: 'color 0.2s'
            },
            'aria-label': 'Close settings'
          },
          React.createElement(CloseIcon)
        )
      ),
      
      // Content
      React.createElement(
        'div',
        {
          style: {
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }
        },
        
        // Tab Navigation
        React.createElement(
          'nav',
          {
            style: {
              width: '200px',
              backgroundColor: 'var(--background-secondary)',
              borderRight: '1px solid var(--border)',
              padding: '16px 0'
            }
          },
          tabs.map(tab =>
            React.createElement(
              'button',
              {
                key: tab.id,
                onClick: () => setActiveTab(tab.id),
                style: {
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? '500' : '400',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }
              },
              React.createElement(tab.icon),
              tab.label
            )
          )
        ),
        
        // Tab Content
        React.createElement(
          'div',
          {
            style: {
              flex: 1,
              padding: '24px',
              overflow: 'auto'
            }
          },
          
          // Appearance Tab
          activeTab === 'appearance' && React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              {
                style: {
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '16px'
                }
              },
              'Theme'
            ),
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px'
                }
              },
              [
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' }
              ].map(option =>
                React.createElement(
                  'label',
                  {
                    key: option.value,
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: settings.theme === option.value ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: settings.theme === option.value ? 'var(--accent)' : 'transparent',
                      transition: 'all 0.2s'
                    }
                  },
                  React.createElement('input', {
                    type: 'radio',
                    name: 'theme',
                    value: option.value,
                    checked: settings.theme === option.value,
                    onChange: (e) => updateSetting('theme', e.target.value),
                    style: { margin: 0 }
                  }),
                  React.createElement('span', null, option.label)
                )
              )
            )
          ),
          
          // Typography Tab
          activeTab === 'typography' && React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              {
                style: {
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '20px'
                }
              },
              'Typography'
            ),
            
            // Font Family
            React.createElement(
              'div',
              { style: { marginBottom: '20px' } },
              React.createElement(
                'label',
                {
                  style: {
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }
                },
                'Font Family'
              ),
              React.createElement('select', {
                value: settings.fontFamily,
                onChange: (e) => updateSetting('fontFamily', e.target.value),
                style: {
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }
              },
              React.createElement('option', { value: 'system' }, 'System'),
              React.createElement('option', { value: 'serif' }, 'Serif'),
              React.createElement('option', { value: 'mono' }, 'Monospace')
              )
            ),
            
            // Font Size
            React.createElement(
              'div',
              { style: { marginBottom: '20px' } },
              React.createElement(
                'label',
                {
                  style: {
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }
                },
                `Font Size (${settings.fontSize}px)`
              ),
              React.createElement('input', {
                type: 'range',
                min: 12,
                max: 24,
                value: settings.fontSize,
                onChange: (e) => updateSetting('fontSize', parseInt(e.target.value)),
                style: {
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--border)',
                  outline: 'none'
                }
              })
            ),
            
            // Line Height
            React.createElement(
              'div',
              { style: { marginBottom: '20px' } },
              React.createElement(
                'label',
                {
                  style: {
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }
                },
                `Line Height (${settings.lineHeight})`
              ),
              React.createElement('input', {
                type: 'range',
                min: 1.2,
                max: 2.0,
                step: 0.1,
                value: settings.lineHeight,
                onChange: (e) => updateSetting('lineHeight', parseFloat(e.target.value)),
                style: {
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--border)',
                  outline: 'none'
                }
              })
            )
          ),
          
          // Shortcuts Tab
          activeTab === 'shortcuts' && React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              {
                style: {
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '20px'
                }
              },
              'Keyboard Shortcuts'
            ),
            React.createElement(
              'div',
              {
                style: {
                  display: 'grid',
                  gap: '12px'
                }
              },
              [
                { keys: 'Ctrl/Cmd + F', desc: 'Open search' },
                { keys: 'Ctrl/Cmd + ←', desc: 'Toggle documents sidebar' },
                { keys: 'Ctrl/Cmd + →', desc: 'Toggle tools sidebar' },
                { keys: 'Ctrl/Cmd + Z', desc: 'Undo' },
                { keys: 'Ctrl/Cmd + Shift + Z', desc: 'Redo' },
                { keys: 'Ctrl/Cmd + Y', desc: 'Redo (alternative)' },
                { keys: 'Ctrl/Cmd + Shift + F', desc: 'Toggle focus mode' },
                { keys: 'Enter', desc: 'Add paragraph' },
                { keys: 'Escape', desc: 'Close dialogs' }
              ].map((shortcut, index) =>
                React.createElement(
                  'div',
                  {
                    key: index,
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--background-secondary)',
                      borderRadius: '8px'
                    }
                  },
                  React.createElement(
                    'span',
                    {
                      style: {
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)'
                      }
                    },
                    shortcut.desc
                  ),
                  React.createElement(
                    'kbd',
                    {
                      style: {
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }
                    },
                    shortcut.keys
                  )
                )
              )
            )
          ),
          
          // About Tab
          activeTab === 'about' && React.createElement(
            'div',
            null,
            React.createElement(
              'h3',
              {
                style: {
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '20px'
                }
              },
              'About Writer'
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  color: 'var(--text-secondary)'
                }
              },
              React.createElement(
                'p',
                { style: { marginBottom: '16px' } },
                'Writer is a structured writing tool inspired by Jordan Peterson\'s Essay.app methodology. It helps you organize your thoughts and create well-structured documents using a paragraph-based approach.'
              ),
              React.createElement(
                'p',
                { style: { marginBottom: '16px' } },
                'Features include drag-and-drop paragraph reordering, real-time search, clipboard for saving reusable content, and markdown support for formatting.'
              ),
              React.createElement(
                'p',
                { style: { marginBottom: '16px' } },
                'All your documents are stored locally in your browser and never sent to external servers, ensuring your privacy and data security.'
              ),
              React.createElement(
                'div',
                {
                  style: {
                    padding: '16px',
                    backgroundColor: 'var(--background-secondary)',
                    borderRadius: '8px',
                    marginTop: '20px'
                  }
                },
                React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px'
                    }
                  },
                  'Storage Information'
                ),
                React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)'
                    }
                  },
                  'Documents: Local Browser Storage',
                  React.createElement('br'),
                  'Settings: Local Browser Storage',
                  React.createElement('br'),
                  'Privacy: No data transmitted externally'
                )
              )
            )
          )
        )
      )
    ),
    
    // Add CSS animation
    React.createElement('style', {
      dangerouslySetInnerHTML: {
        __html: `
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `
      }
    })
  );
}

// Export component
window.SettingsModal = SettingsModal;