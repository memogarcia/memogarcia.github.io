// ToolsSidebar.jsx - Right sidebar with tools, statistics, and tabs
const { useState, useEffect, useMemo } = React;

// Simple icon components
const ClipboardIcon = () => React.createElement('span', null, '📋');
const ListIcon = () => React.createElement('span', null, '📝');
const HistoryIcon = () => React.createElement('span', null, '🕒');
const DownloadIcon = () => React.createElement('span', null, '💾');
const EyeIcon = () => React.createElement('span', null, '👁');
const EditIcon = () => React.createElement('span', null, '✏️');
const FocusIcon = () => React.createElement('span', null, '🎯');
const CloseIcon = () => React.createElement('span', null, '✕');

/**
 * Tools Sidebar Component
 * Contains statistics, mode switcher, export, and tabbed panels
 */
function ToolsSidebar({ onClose }) {
  const [activeTab, setActiveTab] = useState('clipboard');
  
  // Get store state and actions
  const { 
    currentDocument, 
    editorMode, 
    setEditorMode 
  } = window.useWriterStore();
  
  const { toast } = window.useToast();

  // Calculate statistics from current document
  const statistics = useMemo(() => {
    if (!currentDocument || !currentDocument.paragraphs) {
      return {
        wordCount: 0,
        characterCount: 0,
        paragraphCount: 0,
        readingTime: 0
      };
    }

    const text = currentDocument.paragraphs
      .filter(p => p && typeof p.content === 'string')
      .map(p => p.content)
      .join(' ');
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    const paragraphs = currentDocument.paragraphs.length;
    const readingTime = Math.max(1, Math.ceil(words.length / 200)); // Avg 200 words per minute

    return {
      wordCount: words.length,
      characterCount: characters,
      paragraphCount: paragraphs,
      readingTime
    };
  }, [currentDocument]);

  // Mode switcher options
  const modes = [
    { id: 'edit', label: 'Edit', icon: EditIcon },
    { id: 'preview', label: 'Preview', icon: EyeIcon },
    { id: 'focus', label: 'Focus', icon: FocusIcon }
  ];

  // Tab options
  const tabs = [
    { id: 'clipboard', label: 'Clipboard', icon: ClipboardIcon },
    { id: 'toc', label: 'Outline', icon: ListIcon },
    { id: 'history', label: 'History', icon: HistoryIcon }
  ];

  // Handle mode change
  const handleModeChange = (mode) => {
    setEditorMode(mode);
    toast({
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated`,
      description: mode === 'focus' ? 'Use arrow keys to navigate' : 
                  mode === 'preview' ? 'Read-only preview mode' : 'Full editing enabled',
      variant: 'success',
      duration: 2000
    });
  };

  // Handle export
  const handleExport = async () => {
    if (!currentDocument) {
      toast({
        title: 'No document',
        description: 'No document to export',
        variant: 'error'
      });
      return;
    }

    try {
      const content = currentDocument.paragraphs
        .filter(p => p && typeof p.content === 'string')
        .map(p => p.content)
        .join('\n\n');
      
      // Check if exportUtils is available
      if (window.exportAsMarkdown) {
        await window.exportAsMarkdown(currentDocument.title, content);
        toast({
          title: 'Export successful',
          description: 'Document exported as markdown file',
          variant: 'success'
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(content);
        toast({
          title: 'Copied to clipboard',
          description: 'Document content copied to clipboard',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export document',
        variant: 'error'
      });
    }
  };

  return React.createElement(
    'div',
    {
      className: 'tools-sidebar',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background-secondary)'
      }
    },
    
    // Header
    React.createElement(
      'header',
      {
        style: {
          padding: '16px',
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
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }
        },
        'Tools'
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
            padding: '4px',
            borderRadius: '4px',
            fontSize: '14px',
            transition: 'color 0.2s'
          },
          'aria-label': 'Close tools sidebar',
          title: 'Close (Ctrl/Cmd + Right Arrow)'
        },
        React.createElement(CloseIcon)
      )
    ),

    // Statistics Section
    React.createElement(
      'section',
      {
        style: {
          padding: '16px',
          borderBottom: '1px solid var(--border)'
        },
        'aria-label': 'Document statistics'
      },
      React.createElement(
        'h3',
        {
          style: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }
        },
        'Statistics'
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }
        },
        // Word count
        React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary)',
                lineHeight: 1
              }
            },
            statistics.wordCount.toLocaleString()
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px'
              }
            },
            'words'
          )
        ),
        // Character count
        React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary)',
                lineHeight: 1
              }
            },
            statistics.characterCount.toLocaleString()
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px'
              }
            },
            'characters'
          )
        ),
        // Paragraph count
        React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary)',
                lineHeight: 1
              }
            },
            statistics.paragraphCount
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px'
              }
            },
            'paragraphs'
          )
        ),
        // Reading time
        React.createElement(
          'div',
          {
            style: {
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary)',
                lineHeight: 1
              }
            },
            statistics.readingTime
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '2px'
              }
            },
            `min${statistics.readingTime !== 1 ? 's' : ''} read`
          )
        )
      )
    ),

    // Mode Switcher Section
    React.createElement(
      'section',
      {
        style: {
          padding: '16px',
          borderBottom: '1px solid var(--border)'
        },
        'aria-label': 'Editor modes'
      },
      React.createElement(
        'h3',
        {
          style: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }
        },
        'Mode'
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            backgroundColor: 'var(--background)',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid var(--border)'
          }
        },
        modes.map(mode => 
          React.createElement(
            'button',
            {
              key: mode.id,
              onClick: () => handleModeChange(mode.id),
              style: {
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: editorMode === mode.id ? 'var(--primary)' : 'transparent',
                color: editorMode === mode.id ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              },
              title: `Switch to ${mode.label} mode`
            },
            React.createElement(mode.icon),
            React.createElement('span', null, mode.label)
          )
        )
      )
    ),

    // Export Section
    React.createElement(
      'section',
      {
        style: {
          padding: '16px',
          borderBottom: '1px solid var(--border)'
        }
      },
      React.createElement(
        'button',
        {
          onClick: handleExport,
          disabled: !currentDocument,
          style: {
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: currentDocument ? 'pointer' : 'not-allowed',
            opacity: currentDocument ? 1 : 0.5,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          },
          title: currentDocument ? 'Export document as markdown' : 'No document to export'
        },
        React.createElement(DownloadIcon),
        'Export'
      )
    ),

    // Tabs Section
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      },
      
      // Tab Navigation
      React.createElement(
        window.TabsList,
        {
          style: {
            margin: '16px 16px 0 16px',
            flexShrink: 0
          }
        },
        tabs.map(tab =>
          React.createElement(
            window.TabsTrigger,
            {
              key: tab.id,
              value: tab.id,
              style: {
                fontSize: '0.75rem',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              },
              title: `Switch to ${tab.label} tab`
            },
            React.createElement(tab.icon),
            React.createElement('span', null, tab.label)
          )
        )
      ),

      // Tab Content
      React.createElement(
        'div',
        {
          style: {
            flex: 1,
            padding: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        },
        React.createElement(
          window.Tabs,
          {
            value: activeTab,
            onValueChange: setActiveTab,
            style: { height: '100%', display: 'flex', flexDirection: 'column' }
          },
          
          React.createElement(
            window.TabsContent,
            {
              value: 'clipboard',
              style: { flex: 1, overflow: 'hidden' }
            },
            React.createElement(window.ClipboardPanel || 'div', { 
              style: { height: '100%' } 
            })
          ),
          
          React.createElement(
            window.TabsContent,
            {
              value: 'toc',
              style: { flex: 1, overflow: 'hidden' }
            },
            React.createElement(window.TableOfContents || 'div', { 
              document: currentDocument,
              style: { height: '100%' } 
            })
          ),
          
          React.createElement(
            window.TabsContent,
            {
              value: 'history',
              style: { flex: 1, overflow: 'hidden' }
            },
            React.createElement(window.HistoryPanel || 'div', { 
              style: { height: '100%' } 
            })
          )
        )
      )
    )
  );
}

// Export component
window.ToolsSidebar = ToolsSidebar;