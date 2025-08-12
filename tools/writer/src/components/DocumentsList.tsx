import { Plus, FileText, Trash2, Upload, Loader2, Download, Settings } from 'lucide-react';
import { useWriterStore } from '../store/local-store';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { smartSplitParagraphs } from '../utils/textParser';
import { useState } from 'react';
import { ClientOnly } from './ClientOnly';
import { exportToMarkdown } from '../utils/exportUtils';
import { SpeechInput } from './SpeechInput';

interface DocumentsListProps {
  onOpenSettings: () => void;
}

export function DocumentsList({ onOpenSettings }: DocumentsListProps) {
  const {
    documents,
    currentDocument,
    createDocument,
    selectDocument,
    deleteDocument,
  } = useWriterStore();
  
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateDocument = () => {
    createDocument(`Document ${documents.length + 1}`);
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      // Use smart paragraph splitting
      const paragraphs = smartSplitParagraphs(content);
      
      if (paragraphs.length > 0) {
        const { addParagraph } = useWriterStore.getState();
        
        // Create a new document with the imported file name
        const baseTitle = file.name.replace(/\.(txt|md|markdown)$/, '');
        
        // Check if a document with this name already exists
        let title = baseTitle;
        let counter = 1;
        while (documents.some(doc => doc.title === title)) {
          title = `${baseTitle} (${counter})`;
          counter++;
        }
        
        try {
          // Create and select the new document
          console.log('Creating document with title:', title);
          const newDocument = createDocument(title);
          
          if (!newDocument) {
            throw new Error('Failed to create document');
          }
          
          // Add each paragraph
          for (const paragraph of paragraphs) {
            addParagraph(paragraph);
          }
          
          // Show success toast
          if ((window as any).showToast) {
            (window as any).showToast({
              title: 'Import successful',
              description: `Imported ${paragraphs.length} paragraphs from ${file.name}`,
              variant: 'success',
            });
          }
        } catch (error) {
          console.error('Import error:', error);
          if ((window as any).showToast) {
            (window as any).showToast({
              title: 'Import failed',
              description: 'Failed to import document. Please try again.',
              variant: 'error',
            });
          }
        } finally {
          setIsImporting(false);
        }
      } else {
        setIsImporting(false);
        if ((window as any).showToast) {
          (window as any).showToast({
            title: 'Import failed',
            description: 'No paragraphs found in the file.',
            variant: 'error',
          });
        }
      }
    };
    
    reader.onerror = () => {
      setIsImporting(false);
      if ((window as any).showToast) {
        (window as any).showToast({
          title: 'Import failed',
          description: 'Failed to read the file. Please try again.',
          variant: 'error',
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-2">
        <button
          onClick={handleCreateDocument}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-dark transition-colors font-sans"
          aria-label="Create new document"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Document
        </button>
        
        <div className="flex gap-2">
          <label 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border text-secondary hover:text-primary hover:border-primary rounded-lg cursor-pointer transition-colors font-sans"
            aria-label={isImporting ? "Importing document..." : "Import document from file"}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Import</span>
              </>
            )}
            <input
              type="file"
              accept=".txt,.md,.markdown"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
              aria-describedby="file-upload-help"
            />
          </label>
          
          <SpeechInput
            onTranscript={(text) => {
              // Create a new document with speech input
              const title = `Voice Note ${new Date().toLocaleTimeString()}`;
              createDocument(title);
              
              // Add the text as paragraphs
              const { addParagraph } = useWriterStore.getState();
              const paragraphs = smartSplitParagraphs(text);
              paragraphs.forEach((paragraph) => {
                addParagraph(paragraph);
              });
              
              if ((window as any).showToast) {
                (window as any).showToast({
                  title: 'Voice input added',
                  description: `Created document with ${paragraphs.length} paragraph(s)`,
                  variant: 'success',
                });
              }
            }}
            className="px-4 py-2 border border-border text-secondary hover:text-primary hover:border-primary rounded-lg transition-colors"
          />
        </div>
        <div id="file-upload-help" className="sr-only">
          Upload text files (.txt, .md, .markdown) to import as new documents
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {documents.length === 0 ? (
          <div className="text-center text-muted py-8 px-4" role="status" aria-label="No documents available">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Create your first document to get started</p>
          </div>
        ) : (
          <nav aria-label="Documents list" role="navigation">
            <div className="space-y-1" role="list">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => selectDocument(doc.id)}
                  className={cn(
                    "group px-3 py-3 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-hover",
                    currentDocument?.id === doc.id && "bg-hover"
                  )}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`Select document: ${doc.title}`}
                  aria-selected={currentDocument?.id === doc.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectDocument(doc.id);
                    }
                  }}
                >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary truncate font-sans">
                      {doc.title}
                    </h3>
                    <ClientOnly fallback={<p className="text-xs text-muted mt-1">...</p>}>
                      <p className="text-xs text-muted mt-1">
                        {format(doc.updatedAt, 'MMM d, yyyy')}
                      </p>
                    </ClientOnly>
                    <p className="text-xs text-muted">
                      {doc.paragraphs.length} paragraphs
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" role="group" aria-label="Document actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToMarkdown(doc);
                      }}
                      className="p-1 hover:bg-hover rounded"
                      aria-label={`Export document: ${doc.title}`}
                      title="Export document"
                    >
                      <Download className="w-4 h-4 text-secondary" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="p-1 hover:bg-hover rounded"
                      aria-label={`Delete document: ${doc.title}`}
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </nav>
        )}
      </div>
      
      {/* Settings button at bottom */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}