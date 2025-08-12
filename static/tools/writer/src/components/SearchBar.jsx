import React, { useState, useRef, useEffect } from 'react';
import { useWriterStore } from '../store/index.js';

export function SearchBar({ isOpen, onClose }) {
  const { documents, currentDocument, selectDocument } = useWriterStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults = [];
    documents.forEach(doc => {
      (doc.paragraphs || []).forEach((paragraph, index) => {
        if (paragraph.content && paragraph.content.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            id: `${doc.id}-${paragraph.id}`,
            documentTitle: doc.title,
            documentId: doc.id,
            paragraphId: paragraph.id,
            content: paragraph.content,
            paragraphIndex: index
          });
        }
      });
    });
    setResults(searchResults);
  }, [query, documents]);

  const handleResultClick = (result) => {
    selectDocument(result.documentId);
    onClose();
    
    // Scroll to paragraph after document loads
    setTimeout(() => {
      const element = document.getElementById(`paragraph-${result.paragraphId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-bg border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search across all documents..."
            className="w-full p-3 bg-bg border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 ? (
            <div className="p-4 text-center text-muted">
              No results found for "{query}"
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map(result => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="p-3 hover:bg-hover rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border"
                >
                  <div className="text-sm text-accent font-medium mb-1">
                    {result.documentTitle}
                  </div>
                  <div className="text-primary text-sm line-clamp-2">
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border text-center">
          <div className="text-xs text-muted">
            Press <kbd className="bg-hover px-1 rounded">Escape</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}