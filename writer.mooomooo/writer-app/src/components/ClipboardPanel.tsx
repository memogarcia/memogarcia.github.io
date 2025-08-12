import { useState, DragEvent } from 'react';
import { useWriterStore } from '../store';
import { Archive, RotateCcw, Trash2, Edit2, Check, X, Plus, StickyNote, ExternalLink, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ClientOnly } from './ClientOnly';
import { cn } from '../utils/cn';

export function ClipboardPanel() {
  const { clipboard, removeFromClipboard, restoreFromClipboard, updateClipboardNote, addToClipboard, selectDocument, selectParagraph, documents, currentDocument } = useWriterStore();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleStartEditNote = (id: string, currentNote: string) => {
    setEditingNoteId(id);
    setNoteText(currentNote || '');
  };

  const handleSaveNote = (id: string) => {
    updateClipboardNote(id, noteText);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleCreateNote = () => {
    if (newNoteContent.trim()) {
      addToClipboard(newNoteContent.trim());
      setNewNoteContent('');
      setIsCreatingNote(false);
    }
  };

  const handleCancelCreate = () => {
    setNewNoteContent('');
    setIsCreatingNote(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Get the dragged data
    const text = e.dataTransfer.getData('text/plain');
    const paragraphId = e.dataTransfer.getData('paragraph-id');
    const documentId = e.dataTransfer.getData('document-id');

    if (text) {
      // Add to clipboard with reference if available
      addToClipboard(
        text,
        paragraphId ? 'Copied from document' : undefined,
        paragraphId || undefined,
        documentId || currentDocument?.id
      );
    }
  };

  const handleNavigateToSource = (item: typeof clipboard[0]) => {
    if (item.sourceDocumentId && item.sourceParagraphId) {
      // Check if the document still exists
      const sourceDoc = documents.find(doc => doc.id === item.sourceDocumentId);
      if (sourceDoc) {
        // Check if the paragraph still exists in the document
        const paragraphExists = sourceDoc.paragraphs.some(p => p.id === item.sourceParagraphId);
        if (paragraphExists) {
          // Select the document
          selectDocument(item.sourceDocumentId);
          // Select and scroll to the paragraph after a brief delay to ensure document is loaded
          setTimeout(() => {
            selectParagraph(item.sourceParagraphId!);
            const element = document.getElementById(`paragraph-${item.sourceParagraphId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          alert('The source paragraph no longer exists in the document.');
        }
      } else {
        alert('The source document no longer exists.');
      }
    }
  };

  if (clipboard.length === 0 && !isCreatingNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center" role="status">
        <Archive className="w-12 h-12 text-muted/50 mb-3" aria-hidden="true" />
        <p className="text-muted font-medium mb-1">Clipboard is empty</p>
        <p className="text-sm text-muted/70 mb-4">
          Select text and drag it here, or click below to create a note
        </p>
        <button
          onClick={() => setIsCreatingNote(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          aria-label="Create quick note"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Create Quick Note
        </button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "h-full overflow-y-auto p-4 transition-colors relative",
        isDragOver && "bg-accent/10"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="bg-accent/20 backdrop-blur-sm rounded-lg p-6 border-2 border-dashed border-accent">
            <Copy className="w-8 h-8 text-accent mb-2 mx-auto" />
            <p className="text-accent font-medium">Drop to add to clipboard</p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {/* Create Note Button/Form */}
        {!isCreatingNote ? (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg border-2 border-dashed border-border hover:border-accent hover:bg-hover rounded-lg transition-all group"
            aria-label="Create quick note"
          >
            <StickyNote className="w-4 h-4 text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
            <span className="text-sm font-medium text-muted group-hover:text-primary transition-colors">
              Create Quick Note
            </span>
          </button>
        ) : (
          <div className="bg-bg border-2 border-accent rounded-lg p-4 space-y-3">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Type your note, paste links, references..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded focus:outline-none focus:border-secondary min-h-[100px] resize-none"
              autoFocus
              aria-label="New note content"
              aria-describedby="note-help"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleCreateNote();
                } else if (e.key === 'Escape') {
                  handleCancelCreate();
                }
              }}
            />
            <div id="note-help" className="sr-only">
              Press Ctrl/Cmd+Enter to save note, Escape to cancel
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelCreate}
                className="px-3 py-1 text-sm text-muted hover:text-primary transition-colors"
                aria-label="Cancel note creation"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteContent.trim()}
                className="px-4 py-1 text-sm bg-accent text-white rounded-md hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save note"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* Clipboard Items */}
        {clipboard.map((item) => (
          <div
            key={item.id}
            className="bg-bg border border-border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
          >
            {/* Content Preview */}
            <div 
              className={cn(
                "text-sm text-primary line-clamp-3 font-serif relative",
                item.sourceParagraphId && "cursor-pointer hover:text-accent transition-colors group"
              )}
              onClick={() => item.sourceParagraphId && handleNavigateToSource(item)}
              title={item.sourceParagraphId ? "Click to navigate to source paragraph" : undefined}
            >
              {item.content}
              {item.sourceParagraphId && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </div>

            {/* Note section - always show if note exists or being edited */}
            {(item.note && editingNoteId !== item.id) && (
              <div className="text-xs text-muted italic bg-hover px-2 py-1 rounded">
                {item.note}
                {item.sourceParagraphId && (
                  <span className="text-accent ml-2">
                    (from document)
                  </span>
                )}
              </div>
            )}
            
            {/* Note Edit Section */}
            {editingNoteId === item.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-2 py-1 text-sm bg-bg border border-border rounded focus:outline-none focus:border-secondary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNote(item.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => handleSaveNote(item.id)}
                    className="p-1 hover:bg-hover rounded transition-colors"
                    aria-label="Save note changes"
                  >
                    <Check className="w-3 h-3 text-accent" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 hover:bg-hover rounded transition-colors"
                    aria-label="Cancel note editing"
                  >
                    <X className="w-3 h-3 text-muted" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Metadata and Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <ClientOnly fallback={<span className="text-xs text-muted">...</span>}>
                <span className="text-xs text-muted">
                  {format(item.savedAt, 'MMM d, h:mm a')}
                </span>
              </ClientOnly>
              <div className="flex items-center gap-1" role="group" aria-label="Clipboard item actions">
                {item.sourceParagraphId && (
                  <button
                    onClick={() => handleNavigateToSource(item)}
                    className="p-1 hover:bg-hover rounded transition-colors"
                    aria-label="Go to source paragraph"
                    title="Go to source paragraph"
                  >
                    <ExternalLink className="w-3 h-3 text-accent" aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={() => handleStartEditNote(item.id, item.note || '')}
                  className="p-1 hover:bg-hover rounded transition-colors"
                  aria-label={item.note ? "Edit note" : "Add note"}
                  title="Add/Edit note"
                >
                  <Edit2 className="w-3 h-3 text-secondary hover:text-primary" aria-hidden="true" />
                </button>
                <button
                  onClick={() => restoreFromClipboard(item.id)}
                  className="p-1 hover:bg-hover rounded transition-colors"
                  aria-label="Restore to document"
                  title="Restore to document"
                >
                  <RotateCcw className="w-3 h-3 text-secondary hover:text-accent" aria-hidden="true" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remove from clipboard?')) {
                      removeFromClipboard(item.id);
                    }
                  }}
                  className="p-1 hover:bg-hover rounded transition-colors"
                  aria-label="Remove from clipboard"
                  title="Remove from clipboard"
                >
                  <Trash2 className="w-3 h-3 text-secondary hover:text-red-500" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}