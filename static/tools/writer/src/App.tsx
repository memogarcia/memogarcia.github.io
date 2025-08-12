import { useEffect, useState, lazy, Suspense } from 'react';
import { useWriterStore } from './store/local-store';
import { DocumentsList } from './components/DocumentsList';
import { Editor } from './components/Editor';
import { ToolsSidebar } from './components/ToolsSidebar';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import { useUndoRedo } from './hooks/useUndoRedo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { SearchBar } from './components/SearchBar';
import { ClientOnly } from './components/ClientOnly';
import { Login } from './components/Login';
import { ResizeHandle } from './components/ResizeHandle';
import { ComponentErrorBoundary } from './components/ErrorBoundary';

// Lazy load heavy components
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));

function App() {
  const { createDocument, login, editorMode, setEditorMode } = useWriterStore();
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
  const { toasts, toast, dismiss } = useToast();
  const { undo, redo } = useUndoRedo();
  

  
  // Persist sidebar widths
  useEffect(() => {
    localStorage.setItem('leftSidebarWidth', leftSidebarWidth.toString());
  }, [leftSidebarWidth]);
  
  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  const handleLeftSidebarToggle = () => {
    const newState = !leftSidebarOpen;
    setLeftSidebarOpen(newState);
  };

  const handleRightSidebarToggle = () => {
    const newState = !rightSidebarOpen;
    setRightSidebarOpen(newState);
  };

  const handleSearchToggle = () => {
    const newState = !searchOpen;
    setSearchOpen(newState);
  };

  const handleSettingsToggle = () => {
    const newState = !settingsOpen;
    setSettingsOpen(newState);
  };

  // Initialize app with sample content if no documents exist
  useEffect(() => {
    const { documents } = useWriterStore.getState();
    if (documents.length === 0) {
      createDocument('Welcome to Writer');
      
      // Add sample content
      setTimeout(() => {
        const { addParagraphWithoutHistory } = useWriterStore.getState();
        
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
  }, [createDocument]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleLoginSuccess = (userInfo: { email: string; name: string; picture: string }) => {
    login(userInfo);
  };

  return (
    <ClientOnly
      fallback={
        <div className="h-screen flex bg-bg items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      {false ? ( // Auth disabled - was: !isAuthenticated
        <Login onSuccess={handleLoginSuccess} />
      ) : (
      <div className="h-screen flex bg-bg relative">
        {/* Skip navigation links for keyboard users */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#left-sidebar" className="skip-link">Skip to documents</a>
        <a href="#right-sidebar" className="skip-link">Skip to tools</a>
        {/* Toggle Buttons */}
        {!leftSidebarOpen && (
          <button
            onClick={handleLeftSidebarToggle}
            className="absolute left-2 top-4 z-10 p-2 hover:bg-hover rounded-md transition-colors"
            aria-label="Open left sidebar"
            aria-expanded="false"
            aria-controls="left-sidebar"
            title="Open left sidebar (Ctrl/Cmd + Left Arrow)"
          >
            <ChevronRight className="w-5 h-5 text-secondary" />
          </button>
        )}
        
        {!rightSidebarOpen && (
          <button
            onClick={handleRightSidebarToggle}
            className="absolute right-2 top-4 z-10 p-2 hover:bg-hover rounded-md transition-colors"
            aria-label="Open right sidebar"
            aria-expanded="false"
            aria-controls="right-sidebar"
            title="Open right sidebar (Ctrl/Cmd + Right Arrow)"
          >
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
        )}


        {/* Left Column - Documents */}
        <aside
          id="left-sidebar"
          className={`${leftSidebarOpen ? '' : 'w-0'} transition-all duration-300 ${leftSidebarOpen ? 'border-r border-border' : ''} bg-bg-secondary flex-shrink-0 overflow-hidden relative`}
          style={leftSidebarOpen ? { width: `${leftSidebarWidth}px` } : { width: 0 }}
          aria-label="Documents sidebar"
          aria-hidden={!leftSidebarOpen}
        >
          <div className="h-full flex flex-col" style={{ width: `${leftSidebarWidth}px` }}>
            <header className="p-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-primary font-sans">
                Writer
              </h1>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  onClick={handleLeftSidebarToggle}
                  className="p-1 hover:bg-hover rounded-md transition-colors"
                  aria-label="Close left sidebar"
                  aria-expanded="true"
                  aria-controls="left-sidebar"
                  title="Close left sidebar (Ctrl/Cmd + Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5 text-secondary" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <ComponentErrorBoundary>
                <DocumentsList onOpenSettings={handleSettingsToggle} />
              </ComponentErrorBoundary>
            </div>
          </div>
          {leftSidebarOpen && (
            <ResizeHandle 
              side="left" 
              onResize={(delta) => {
                setLeftSidebarWidth(prev => Math.max(200, Math.min(400, prev + delta)));
              }}
            />
          )}
        </aside>

        {/* Center Column - Editor */}
        <main 
          id="main-content"
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          role="main"
          aria-label="Document editor"
        >
          <ComponentErrorBoundary>
            <Editor showBorders={leftSidebarOpen || rightSidebarOpen} />
          </ComponentErrorBoundary>
        </main>

        {/* Right Column - Tools */}
        <aside
          id="right-sidebar"
          className={`${rightSidebarOpen ? '' : 'w-0'} transition-all duration-300 ${rightSidebarOpen ? 'border-l border-border' : ''} bg-bg-secondary flex-shrink-0 overflow-hidden relative`}
          style={rightSidebarOpen ? { width: `${rightSidebarWidth}px` } : { width: 0 }}
          aria-label="Tools sidebar"
          aria-hidden={!rightSidebarOpen}
        >
          {rightSidebarOpen && (
            <ResizeHandle 
              side="right" 
              onResize={(delta) => {
                setRightSidebarWidth(prev => Math.max(260, Math.min(500, prev + delta)));
              }}
            />
          )}
          <div className="h-full" style={{ width: `${rightSidebarWidth}px` }}>
            <ComponentErrorBoundary>
              <ToolsSidebar onClose={handleRightSidebarToggle} />
            </ComponentErrorBoundary>
          </div>
        </aside>

        <SearchBar isOpen={searchOpen} onClose={handleSearchToggle} />
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-bg rounded-lg p-4">Loading...</div>
        </div>}>
          <SettingsModal isOpen={settingsOpen} onClose={handleSettingsToggle} />
        </Suspense>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
      )}
    </ClientOnly>
  );
}

export default App;