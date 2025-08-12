import { useState, useEffect } from 'react';
import { useWriterStore } from '../store';

interface EditorHeaderProps {
  showBorders?: boolean;
}

export function EditorHeader({ showBorders = true }: EditorHeaderProps) {
  const { currentDocument, updateDocumentTitle } = useWriterStore();
  const [title, setTitle] = useState(currentDocument?.title || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTitle(currentDocument?.title || '');
  }, [currentDocument]);

  const handleTitleSubmit = () => {
    if (title.trim() && title !== currentDocument?.title) {
      updateDocumentTitle(title.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(currentDocument?.title || '');
      setIsEditing(false);
    }
  };

  return (
    <div className={`${showBorders ? 'border-b border-border' : ''} bg-bg`}>
      <div className="max-w-4xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="text-2xl font-semibold text-primary bg-transparent border-b-2 border-primary/30 outline-none font-sans"
                autoFocus
                aria-label="Document title"
              />
            ) : (
              <h1
                onClick={() => setIsEditing(true)}
                className="text-2xl font-semibold text-primary cursor-text hover:opacity-80 transition-opacity font-sans"
                title="Click to edit title"
              >
                {currentDocument?.title}
              </h1>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}