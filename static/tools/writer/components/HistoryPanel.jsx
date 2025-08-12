// HistoryPanel.jsx - Simple history panel with undo/redo functionality
const { useState, useEffect, useMemo } = React;

// Simple icon components
const HistoryIcon = () => React.createElement('span', null, '🕒');
const UndoIcon = () => React.createElement('span', null, '↶');
const RedoIcon = () => React.createElement('span', null, '↷');
const ClearIcon = () => React.createElement('span', null, '🗑');

/**
 * HistoryPanel Component
 * Simple history panel showing recent actions with undo/redo
 */
function HistoryPanel({ style = {} }) {
  const [historyLog, setHistoryLog] = useState(() => {
    // Try to load history from localStorage
    const saved = localStorage.getItem('writer-history-log');
    return saved ? JSON.parse(saved) : [];
  });

  // Get undo/redo functions and state
  const { undo, redo, canUndo, canRedo } = window.useUndoRedo();
  const { toast } = window.useToast();

  // Save history log to localStorage
  useEffect(() => {
    localStorage.setItem('writer-history-log', JSON.stringify(historyLog));
  }, [historyLog]);

  // Add action to history log
  const addToHistoryLog = (action, description) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      action,
      description,
      timestamp: new Date().toISOString()
    };
    
    setHistoryLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Listen for document changes (if available)
  useEffect(() => {
    // Simple observer for document changes
    const handleStorageChange = (e) => {
      if (e.key === 'writer-documents') {
        addToHistoryLog('document_change', 'Document updated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle undo
  const handleUndo = () => {
    try {
      undo();
      addToHistoryLog('undo', 'Undid last action');
      toast({
        title: 'Undone',
        description: 'Last action has been undone',
        variant: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('Undo failed:', error);
      toast({
        title: 'Undo failed',
        description: 'Could not undo last action',
        variant: 'error'
      });
    }
  };

  // Handle redo
  const handleRedo = () => {
    try {
      redo();
      addToHistoryLog('redo', 'Redid last undone action');
      toast({
        title: 'Redone',
        description: 'Action has been redone',
        variant: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('Redo failed:', error);
      toast({
        title: 'Redo failed',
        description: 'Could not redo action',
        variant: 'error'
      });
    }
  };

  // Clear history log
  const clearHistory = () => {
    if (confirm('Clear history log? This will not affect your document.')) {
      setHistoryLog([]);
      toast({
        title: 'History cleared',
        description: 'History log has been cleared',
        variant: 'success',
        duration: 1500
      });
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    const icons = {
      'undo': '↶',
      'redo': '↷',
      'document_change': '📝',
      'paragraph_add': '➕',
      'paragraph_delete': '➖',
      'paragraph_edit': '✏️',
      'paragraph_move': '↕️',
      'clipboard_add': '📋',
      'export': '💾',
      'search': '🔍',
      'mode_change': '🎯'
    };
    
    return icons[action] || '•';
  };

  // Group history by time periods
  const groupedHistory = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    historyLog.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      
      if (entryDate >= today) {
        groups.today.push(entry);
      } else if (entryDate >= yesterday) {
        groups.yesterday.push(entry);
      } else if (entryDate >= thisWeek) {
        groups.thisWeek.push(entry);
      } else {
        groups.older.push(entry);
      }
    });
    
    return groups;
  }, [historyLog]);

  return React.createElement(
    'div',
    {
      className: 'history-panel',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }
    },
    
    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border)'
        }
      },
      React.createElement(HistoryIcon),
      React.createElement(
        'h3',
        {
          style: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0,
            flex: 1
          }
        },
        'History'
      ),
      historyLog.length > 0 && React.createElement(
        'button',
        {
          onClick: clearHistory,
          style: {
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '12px'
          },
          title: 'Clear history log'
        },
        React.createElement(ClearIcon)
      )
    ),
    
    // Undo/Redo Controls
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }
      },
      React.createElement(
        'button',
        {
          onClick: handleUndo,
          disabled: !canUndo,
          style: {
            flex: 1,
            padding: '8px 12px',
            backgroundColor: canUndo ? 'var(--primary)' : 'var(--background-secondary)',
            color: canUndo ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: '500',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          },
          title: canUndo ? 'Undo last action (Ctrl/Cmd + Z)' : 'Nothing to undo'
        },
        React.createElement(UndoIcon),
        'Undo'
      ),
      React.createElement(
        'button',
        {
          onClick: handleRedo,
          disabled: !canRedo,
          style: {
            flex: 1,
            padding: '8px 12px',
            backgroundColor: canRedo ? 'var(--primary)' : 'var(--background-secondary)',
            color: canRedo ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: '500',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          },
          title: canRedo ? 'Redo last undone action (Ctrl/Cmd + Y)' : 'Nothing to redo'
        },
        React.createElement(RedoIcon),
        'Redo'
      )
    ),
    
    // History Log
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          overflow: 'auto'
        }
      },
      
      // Empty state
      historyLog.length === 0 && React.createElement(
        'div',
        {
          style: {
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            lineHeight: '1.5'
          }
        },
        React.createElement(
          'div',
          { style: { marginBottom: '8px', fontSize: '24px' } },
          '🕒'
        ),
        React.createElement(
          'div',
          { style: { fontWeight: '500', marginBottom: '4px' } },
          'No history yet'
        ),
        React.createElement(
          'div',
          null,
          'Actions will appear here as you use the editor'
        )
      ),
      
      // History groups
      Object.entries(groupedHistory).map(([groupName, entries]) => {
        if (entries.length === 0) return null;
        
        const groupLabels = {
          today: 'Today',
          yesterday: 'Yesterday', 
          thisWeek: 'This Week',
          older: 'Older'
        };
        
        return React.createElement(
          'div',
          {
            key: groupName,
            style: {
              marginBottom: '16px'
            }
          },
          
          // Group header
          React.createElement(
            'div',
            {
              style: {
                fontSize: '0.6875rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                paddingLeft: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }
            },
            groupLabels[groupName]
          ),
          
          // Group entries
          entries.map(entry =>
            React.createElement(
              'div',
              {
                key: entry.id,
                style: {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '0.8125rem'
                }
              },
              
              // Action icon
              React.createElement(
                'div',
                {
                  style: {
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    marginTop: '1px',
                    minWidth: '16px',
                    textAlign: 'center'
                  }
                },
                getActionIcon(entry.action)
              ),
              
              // Content
              React.createElement(
                'div',
                {
                  style: {
                    flex: 1,
                    minWidth: 0
                  }
                },
                React.createElement(
                  'div',
                  {
                    style: {
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                      wordWrap: 'break-word'
                    }
                  },
                  entry.description
                ),
                React.createElement(
                  'div',
                  {
                    style: {
                      color: 'var(--text-secondary)',
                      fontSize: '0.6875rem'
                    }
                  },
                  formatTime(entry.timestamp)
                )
              )
            )
          )
        );
      })
    ),
    
    // Footer info
    historyLog.length > 0 && React.createElement(
      'div',
      {
        style: {
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: '1.3'
        }
      },
      `${historyLog.length} actions logged • Use Ctrl/Cmd + Z/Y for quick undo/redo`
    )
  );
}

// Export component
window.HistoryPanel = HistoryPanel;