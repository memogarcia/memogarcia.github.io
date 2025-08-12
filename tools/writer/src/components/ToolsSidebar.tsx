import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { ClipboardPanel } from './ClipboardPanel';
import { TableOfContents } from './TableOfContents';
import { HistoryPanel } from './HistoryPanel';
import { useWriterStore } from '../store/local-store';
import { Archive, ListOrdered, ChevronRight, Edit2, Eye, Download, Focus, History } from 'lucide-react';
import { exportToMarkdown } from '../utils/exportUtils';
import { EditorMode } from '../types';

interface ToolsSidebarProps {
  onClose?: () => void;
}

export function ToolsSidebar({ onClose }: ToolsSidebarProps) {
  const { activeToolTab, setActiveToolTab, editorMode, setEditorMode, currentDocument } = useWriterStore();

  // Calculate word and character counts
  const { wordCount, charCount, paragraphCount } = useMemo(() => {
    if (!currentDocument) return { wordCount: 0, charCount: 0, paragraphCount: 0 };
    
    let totalWords = 0;
    let totalChars = 0;
    const paragraphs = currentDocument.paragraphs.length;
    
    currentDocument.paragraphs.forEach(paragraph => {
      const text = paragraph.content;
      totalChars += text.length;
      // Count words by splitting on whitespace and filtering empty strings
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      totalWords += words.length;
    });
    
    return { wordCount: totalWords, charCount: totalChars, paragraphCount: paragraphs };
  }, [currentDocument]);

  const handleModeChange = () => {
    // Cycle through modes: edit -> preview -> focus -> edit
    const nextMode: EditorMode = 
      editorMode === 'edit' ? 'preview' : 
      editorMode === 'preview' ? 'focus' : 'edit';
    
    setEditorMode(nextMode);
  };

  const handleTabChange = (tab: string) => {
    setActiveToolTab(tab as any);
  };

  const handleExport = () => {
    if (currentDocument) {
      exportToMarkdown(currentDocument);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary font-sans">Tools</h2>
        <div className="flex items-center gap-2" role="toolbar" aria-label="Sidebar actions">
          <button
            onClick={handleExport}
            className="p-2 hover:bg-hover rounded-md transition-colors flex items-center gap-2"
            aria-label="Export current document to Markdown"
            title="Export to Markdown"
            disabled={!currentDocument}
          >
            <Download className="w-4 h-4 text-secondary" aria-hidden="true" />
            <span className="text-sm text-secondary">Export</span>
          </button>
          <button
            onClick={handleModeChange}
            className="p-2 hover:bg-hover rounded-md transition-colors flex items-center gap-2"
            aria-label={`Current mode: ${editorMode}. Click to switch to ${
              editorMode === 'edit' ? 'preview' : 
              editorMode === 'preview' ? 'focus' : 'edit'
            } mode`}
            aria-pressed={editorMode !== 'edit'}
            title={`Current mode: ${editorMode}. Click to change.`}
          >
            {editorMode === 'edit' ? (
              <>
                <Edit2 className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span className="text-sm text-secondary">Edit</span>
              </>
            ) : editorMode === 'preview' ? (
              <>
                <Eye className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span className="text-sm text-secondary">Preview</span>
              </>
            ) : (
              <>
                <Focus className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span className="text-sm text-secondary">Focus</span>
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-hover rounded-md transition-colors"
              aria-label="Close right sidebar"
              aria-expanded="true"
              aria-controls="right-sidebar"
              title="Close right sidebar (Ctrl/Cmd + Right Arrow)"
            >
              <ChevronRight className="w-5 h-5 text-secondary" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Statistics Section */}
      <div className="px-4 py-4 border-b border-border">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col" title="Word count">
            <div className="text-2xl font-semibold text-primary">{wordCount.toLocaleString()}</div>
            <div className="text-xs text-secondary mt-1">words</div>
          </div>
          <div className="flex flex-col" title="Character count">
            <div className="text-2xl font-semibold text-primary">{charCount.toLocaleString()}</div>
            <div className="text-xs text-secondary mt-1">chars</div>
          </div>
          <div className="flex flex-col" title="Paragraph count">
            <div className="text-2xl font-semibold text-primary">{paragraphCount}</div>
            <div className="text-xs text-secondary mt-1">paragraphs</div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeToolTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
        aria-label="Tool panels"
      >
        <TabsList className="grid w-full grid-cols-3 px-4 mt-2" role="tablist" aria-label="Tool options">
          <TabsTrigger 
            value="clipboard" 
            className="flex items-center gap-1"
            aria-label="Clipboard panel"
          >
            <Archive className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Clipboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="toc" 
            className="flex items-center gap-1"
            aria-label="Table of contents panel"
          >
            <ListOrdered className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Contents</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-1"
            aria-label="History panel"
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent 
            value="clipboard" 
            className="h-full m-0"
            role="tabpanel" 
            aria-labelledby="clipboard-tab"
            tabIndex={0}
          >
            <ClipboardPanel />
          </TabsContent>
          <TabsContent 
            value="toc" 
            className="h-full m-0"
            role="tabpanel" 
            aria-labelledby="toc-tab"
            tabIndex={0}
          >
            <TableOfContents />
          </TabsContent>
          <TabsContent 
            value="history" 
            className="h-full m-0"
            role="tabpanel" 
            aria-labelledby="history-tab"
            tabIndex={0}
          >
            <HistoryPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}