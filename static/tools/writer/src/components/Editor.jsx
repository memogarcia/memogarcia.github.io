import React, { useState } from 'react';
import { useWriterStore } from '../store/index.js';

export function Editor({ showBorders = true }) {
  const { currentDocument, updateDocumentTitle, addParagraph, updateParagraph, deleteParagraph } = useWriterStore();
  const [newParagraphContent, setNewParagraphContent] = useState('');

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <p>Select or create a document to start writing</p>
      </div>
    );
  }

  const handleTitleClick = () => {
    const newTitle = prompt('Enter new title:', currentDocument.title);
    if (newTitle && newTitle.trim() !== currentDocument.title) {
      updateDocumentTitle(newTitle.trim());
    }
  };

  const handleAddParagraph = (e) => {
    e.preventDefault();
    if (newParagraphContent.trim()) {
      addParagraph(newParagraphContent.trim());
      setNewParagraphContent('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`${showBorders ? 'border-b border-border' : ''} bg-bg`}>
        <div className="max-w-4xl mx-auto px-8 py-4">
          <h1
            onClick={handleTitleClick}
            className="text-2xl font-semibold text-primary cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to edit title"
          >
            {currentDocument.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-8 py-8">
          {/* Paragraphs */}
          {currentDocument.paragraphs?.length === 0 ? (
            <div className="text-center py-16 text-muted cursor-text min-h-[400px] flex items-center justify-center">
              <div>
                <p className="text-lg mb-2">Your document is empty</p>
                <p className="text-sm">Add your first paragraph below</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDocument.paragraphs?.map((paragraph, index) => (
                <SimpleParagraph
                  key={paragraph.id}
                  paragraph={paragraph}
                  onUpdate={updateParagraph}
                  onDelete={deleteParagraph}
                  onAddAfter={(content) => addParagraph(content, index + 1)}
                />
              ))}
            </div>
          )}

          {/* Add new paragraph form */}
          <form onSubmit={handleAddParagraph} className="mt-8">
            <textarea
              value={newParagraphContent}
              onChange={(e) => setNewParagraphContent(e.target.value)}
              placeholder="Write your next paragraph..."
              className="w-full p-4 border border-border rounded-lg bg-bg text-primary placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleAddParagraph(e);
                }
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                disabled={!newParagraphContent.trim()}
              >
                Add Paragraph (Ctrl+Enter)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Simple Paragraph Component
function SimpleParagraph({ paragraph, onUpdate, onDelete, onAddAfter }) {
  const [isEditing, setIsEditing] = useState(paragraph.content === '');
  const [editContent, setEditContent] = useState(paragraph.content);

  const handleSave = () => {
    if (editContent.trim() !== paragraph.content) {
      onUpdate(paragraph.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(paragraph.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this paragraph?')) {
      onDelete(paragraph.id);
    }
  };

  return (
    <div className="group relative p-4 border border-transparent hover:border-border rounded-lg transition-colors">
      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-border rounded-lg bg-bg text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={Math.max(3, editContent.split('\n').length)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-accent text-bg rounded text-sm hover:bg-accent-dark transition-colors"
            >
              Save (Ctrl+Enter)
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 border border-border text-secondary rounded text-sm hover:bg-hover transition-colors"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="cursor-text">
          <div 
            className="text-primary whitespace-pre-wrap"
            style={{ minHeight: '1.5rem' }}
          >
            {paragraph.content || 'Click to edit...'}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={handleDelete}
          className="p-1 text-red-500 hover:bg-red-50 rounded text-sm"
          title="Delete paragraph"
        >
          🗑️
        </button>
        <button
          onClick={() => onAddAfter('')}
          className="p-1 text-secondary hover:bg-hover rounded text-sm"
          title="Add paragraph after"
        >
          ➕
        </button>
      </div>
    </div>
  );
}