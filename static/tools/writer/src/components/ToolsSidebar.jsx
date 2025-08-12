import React, { useState, useMemo } from 'react';
import { useWriterStore } from '../store/index.js';

export function ToolsSidebar({ onClose }) {
  const { currentDocument } = useWriterStore();
  const [activeTab, setActiveTab] = useState('stats');

  // Calculate document statistics
  const { wordCount, charCount, paragraphCount } = useMemo(() => {
    if (!currentDocument) return { wordCount: 0, charCount: 0, paragraphCount: 0 };
    
    let totalWords = 0;
    let totalChars = 0;
    const paragraphs = currentDocument.paragraphs?.length || 0;
    
    (currentDocument.paragraphs || []).forEach(paragraph => {
      const text = paragraph.content || '';
      totalChars += text.length;
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      totalWords += words.length;
    });
    
    return { wordCount: totalWords, charCount: totalChars, paragraphCount: paragraphs };
  }, [currentDocument]);

  const handleExport = () => {
    if (!currentDocument) return;
    
    // Create markdown content
    let markdown = `# ${currentDocument.title}\n\n`;
    (currentDocument.paragraphs || []).forEach(paragraph => {
      if (paragraph.content?.trim()) {
        markdown += `${paragraph.content}\n\n`;
      }
    });
    
    // Download as file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Tools</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 hover:bg-hover rounded-lg transition-colors text-secondary hover:text-primary"
              disabled={!currentDocument}
              title="Export to Markdown"
            >
              📥 Export
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-hover rounded-lg transition-colors text-secondary hover:text-primary"
                title="Close Tools Panel"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col" title="Word count">
            <div className="text-2xl font-semibold text-primary">
              {wordCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-1">words</div>
          </div>
          <div className="flex flex-col" title="Character count">
            <div className="text-2xl font-semibold text-primary">
              {charCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-1">chars</div>
          </div>
          <div className="flex flex-col" title="Paragraph count">
            <div className="text-2xl font-semibold text-primary">
              {paragraphCount}
            </div>
            <div className="text-xs text-muted mt-1">paragraphs</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'stats' 
                ? 'bg-accent text-bg' 
                : 'text-secondary hover:text-primary hover:bg-hover'
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActiveTab('clipboard')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'clipboard' 
                ? 'bg-accent text-bg' 
                : 'text-secondary hover:text-primary hover:bg-hover'
            }`}
          >
            📋 Clipboard
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'stats' && (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-primary mb-2">Document Info</h3>
                {currentDocument ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Title:</span>
                      <span className="text-primary">{currentDocument.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Created:</span>
                      <span className="text-primary">
                        {new Date(currentDocument.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Modified:</span>
                      <span className="text-primary">
                        {new Date(currentDocument.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-sm">No document selected</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-primary mb-2">Reading Time</h3>
                <div className="text-sm text-secondary">
                  ~{Math.ceil(wordCount / 200)} minutes
                </div>
                <div className="text-xs text-muted mt-1">
                  (assuming 200 words/min)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clipboard' && (
          <ClipboardPanel />
        )}
      </div>
    </div>
  );
}

// Simplified clipboard panel
function ClipboardPanel() {
  const [items] = useState([]); // Simplified - no clipboard functionality yet
  
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-muted font-medium mb-1">Clipboard is empty</p>
        <p className="text-sm text-muted/70">
          Clipboard functionality coming soon
        </p>
      </div>
    </div>
  );
}