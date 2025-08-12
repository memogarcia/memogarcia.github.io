// Import utilities and hooks (loaded via script tags)
// import { useWriterStore, WriterProvider } from './store/index.js';
// import { useToast } from './hooks/useToast.js';
// import { useUndoRedo } from './hooks/useUndoRedo.js';

const { useState, useEffect } = React;

// Placeholder components for icons (will be replaced with proper icon library later)
const ChevronLeft = ({ className }) => 
  React.createElement('span', { className }, '◀');

const ChevronRight = ({ className }) => 
  React.createElement('span', { className }, '▶');

/**
 * Main Writer Application Component
 * Migrated from Next.js TypeScript to vanilla React JavaScript
 */
function WriterMainApp() {
  // Get store functions and state
  const { 
    currentDocument, 
    createDocument, 
    loadDocuments, 
    editorMode, 
    setEditorMode, 
    isLoading 
  } = useWriterStore();

  // UI State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leftSidebarWidth');
      return saved ? parseInt(saved) : 280;
    }
    return 280;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rightSidebarWidth');
      return saved ? parseInt(saved) : 320;
    }
    return 320;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hooks
  const { toasts, toast, dismiss } = useToast();
  const { undo, redo } = useUndoRedo();

  // Persist sidebar widths
  useEffect(() => {
    localStorage.setItem('leftSidebarWidth', leftSidebarWidth.toString());
  }, [leftSidebarWidth]);
  
  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  // Toggle handlers
  const handleLeftSidebarToggle = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const handleRightSidebarToggle = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Load documents on startup and create welcome document if needed
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadDocuments();
        
        // Get current state after loading
        const store = useWriterStore.getState ? useWriterStore.getState() : useWriterStore();
        const documents = store.documents || [];
        
        // If no documents exist, create a welcome document
        if (documents.length === 0) {
          const welcomeDoc = await createDocument('Welcome to Writer');
          
          if (welcomeDoc) {
            // Add sample content with a small delay
            setTimeout(() => {
              const { addParagraphWithoutHistory } = useWriterStore();
              
              addParagraphWithoutHistory('# Welcome to Writer');
              addParagraphWithoutHistory('This is a **structured writing tool** inspired by Jordan Peterson\'s Essay.app methodology. It helps you organize your thoughts and create well-structured documents.');
              addParagraphWithoutHistory('## Key Features');
              addParagraphWithoutHistory('- **Drag and Drop**: Reorder paragraphs by dragging them with the grip handle on the left');
              addParagraphWithoutHistory('- **Markdown Support**: Write using familiar markdown syntax for formatting');
              addParagraphWithoutHistory('- **Local Storage**: Your documents are automatically saved to your browser\'s local storage');
              addParagraphWithoutHistory('- **Clipboard**: Save paragraphs for later by clicking the archive icon');
              addParagraphWithoutHistory('## Getting Started');
              addParagraphWithoutHistory('1. Start typing in the text box at the bottom of the screen');
              addParagraphWithoutHistory('2. Press Enter to add your paragraph');
              addParagraphWithoutHistory('3. Drag paragraphs to reorder them');
              addParagraphWithoutHistory('4. Use the tools sidebar to access clipboard and table of contents');
              addParagraphWithoutHistory('> Pro tip: You can collapse the sidebars to focus on your writing!');
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to load documents. Please refresh the page.',
          variant: 'error',
        });
      }
    };
    
    initializeApp();
  }, [loadDocuments, createDocument, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Search toggle (Cmd/Ctrl + F)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        handleSearchToggle();
      }
      
      // Undo/Redo shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') || 
          ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Focus mode toggle (Cmd/Ctrl + Shift + F)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        const nextMode = editorMode === 'focus' ? 'edit' : 'focus';
        setEditorMode(nextMode);
        toast({
          title: `${nextMode === 'focus' ? 'Focus' : 'Edit'} mode activated`,
          description: nextMode === 'focus' ? 'Use arrow keys to navigate' : 'Full editing enabled',
          variant: 'success',
        });
      }
      
      // Toggle left sidebar (Cmd/Ctrl + Left Arrow)
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleLeftSidebarToggle();
      }
      
      // Toggle right sidebar (Cmd/Ctrl + Right Arrow)
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        handleRightSidebarToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, undo, redo, editorMode, setEditorMode, toast, leftSidebarOpen, rightSidebarOpen]);

  if (isLoading) {
    return React.createElement(
      'div',
      {
        className: 'h-screen flex bg-bg items-center justify-center',
        style: {
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background)',
          color: 'var(--text-secondary)'
        }
      },
      React.createElement('div', { className: 'text-muted' }, 'Loading...')
    );
  }

  return React.createElement(
    'div',
    { 
      className: 'h-screen flex bg-bg relative',
      style: { height: '100vh', display: 'flex', backgroundColor: 'var(--background)', position: 'relative' }
    },

    // Skip navigation links for accessibility
    React.createElement('a', {
      href: '#main-content',
      className: 'skip-link',
      style: { 
        position: 'absolute', 
        top: '-40px', 
        left: '6px', 
        background: 'var(--background)', 
        color: 'var(--text-primary)',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 1000,
        borderRadius: '4px'
      }
    }, 'Skip to main content'),

    // Left sidebar toggle button (when collapsed)
    !leftSidebarOpen && React.createElement(
      'button',
      {
        onClick: handleLeftSidebarToggle,
        className: 'absolute left-2 top-4 z-10 p-2 hover:bg-hover rounded-md transition-colors',
        'aria-label': 'Open left sidebar',
        'aria-expanded': 'false',
        'aria-controls': 'left-sidebar',
        title: 'Open left sidebar (Ctrl/Cmd + Left Arrow)',
        style: {
          position: 'absolute',
          left: '8px',
          top: '16px',
          zIndex: 10,
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }
      },
      React.createElement(ChevronRight, { className: 'w-5 h-5 text-secondary' })
    ),
    
    // Right sidebar toggle button (when collapsed)
    !rightSidebarOpen && React.createElement(
      'button',
      {
        onClick: handleRightSidebarToggle,
        className: 'absolute right-2 top-4 z-10 p-2 hover:bg-hover rounded-md transition-colors',
        'aria-label': 'Open right sidebar',
        'aria-expanded': 'false',
        'aria-controls': 'right-sidebar',
        title: 'Open right sidebar (Ctrl/Cmd + Right Arrow)',
        style: {
          position: 'absolute',
          right: '8px',
          top: '16px',
          zIndex: 10,
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }
      },
      React.createElement(ChevronLeft, { className: 'w-5 h-5 text-secondary' })
    ),

    // Left Column - Documents
    React.createElement(
      'aside',
      {
        id: 'left-sidebar',
        className: `${leftSidebarOpen ? '' : 'w-0'} transition-all duration-300 ${leftSidebarOpen ? 'border-r border-border' : ''} bg-bg-secondary flex-shrink-0 overflow-hidden relative`,
        style: {
          width: leftSidebarOpen ? `${leftSidebarWidth}px` : 0,
          transition: 'all 0.3s ease',
          borderRight: leftSidebarOpen ? '1px solid var(--border)' : 'none',
          backgroundColor: 'var(--background-secondary)',
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative'
        },
        'aria-label': 'Documents sidebar',
        'aria-hidden': !leftSidebarOpen
      },
      React.createElement(
        'div',
        {
          className: 'h-full flex flex-col',
          style: { 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            width: `${leftSidebarWidth}px` 
          }
        },
        // Header
        React.createElement(
          'header',
          {
            className: 'p-4 flex items-center justify-between',
            style: {
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }
          },
          React.createElement(
            'h1',
            {
              className: 'text-xl font-semibold text-primary font-sans',
              style: {
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }
            },
            'Writer'
          ),
          React.createElement(
            'div',
            {
              className: 'flex items-center gap-1',
              style: { display: 'flex', alignItems: 'center', gap: '4px' }
            },
            React.createElement(ThemeToggle),
            React.createElement(
              'button',
              {
                onClick: handleLeftSidebarToggle,
                className: 'p-1 hover:bg-hover rounded-md transition-colors',
                'aria-label': 'Close left sidebar',
                'aria-expanded': 'true',
                'aria-controls': 'left-sidebar',
                title: 'Close left sidebar (Ctrl/Cmd + Left Arrow)',
                style: {
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }
              },
              React.createElement(ChevronLeft, { className: 'w-5 h-5 text-secondary' })
            )
          )
        ),
        // Documents list
        React.createElement(
          'div',
          {
            className: 'flex-1 overflow-hidden',
            style: { flex: 1, overflow: 'hidden' }
          },
          React.createElement(DocumentsList, { onOpenSettings: handleSettingsToggle })
        )
      )
    ),

    // Center Column - Editor
    React.createElement(
      'main',
      {
        id: 'main-content',
        className: 'flex-1 flex flex-col min-w-0 overflow-hidden',
        role: 'main',
        'aria-label': 'Document editor',
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden'
        }
      },
      React.createElement(Editor, { 
        showBorders: leftSidebarOpen || rightSidebarOpen 
      })
    ),

    // Right Column - Tools
    React.createElement(
      'aside',
      {
        id: 'right-sidebar',
        className: `${rightSidebarOpen ? '' : 'w-0'} transition-all duration-300 ${rightSidebarOpen ? 'border-l border-border' : ''} bg-bg-secondary flex-shrink-0 overflow-hidden relative`,
        style: {
          width: rightSidebarOpen ? `${rightSidebarWidth}px` : 0,
          transition: 'all 0.3s ease',
          borderLeft: rightSidebarOpen ? '1px solid var(--border)' : 'none',
          backgroundColor: 'var(--background-secondary)',
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative'
        },
        'aria-label': 'Tools sidebar',
        'aria-hidden': !rightSidebarOpen
      },
      React.createElement(
        'div',
        {
          className: 'h-full',
          style: { 
            height: '100%', 
            width: `${rightSidebarWidth}px` 
          }
        },
        React.createElement(ToolsSidebar, { 
          onClose: handleRightSidebarToggle 
        })
      )
    ),

    // Search Bar (when open)
    searchOpen && React.createElement(SearchBar, { 
      isOpen: searchOpen, 
      onClose: handleSearchToggle 
    }),

    // Settings Modal (when open)
    settingsOpen && React.createElement(SettingsModal, {
      isOpen: settingsOpen,
      onClose: handleSettingsToggle
    }),

    // Toast Container
    React.createElement(ToastContainer, { 
      toasts: toasts, 
      onDismiss: dismiss 
    })
  );
}

// Wrapper App Component with Provider
function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Allow time for all modules to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return React.createElement(
      'div',
      {
        style: {
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)'
        }
      },
      React.createElement(
        'div',
        { className: 'loading' },
        'Loading Writer...'
      )
    );
  }

  return React.createElement(
    WriterProvider,
    null,
    React.createElement(WriterMainApp)
  );
}

// Render the app
document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    
    console.log('Writer app initialized successfully');
});

// Export for global access
window.WriterApp = WriterApp;
window.App = App;