import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useWriterStore } from '../store/local-store';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '../utils/debounce';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matches, setMatches] = useState<{ paragraphId: string; indices: number[] }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { currentDocument, selectParagraph, setSearchTerm: setGlobalSearchTerm } = useWriterStore();

  // Create debounced search function
  const performSearch = useMemo(() => 
    debounce((term: string) => {
      setGlobalSearchTerm(term);
      setIsSearching(false);
      
      if (!term || !currentDocument) {
        setMatches([]);
        setMatchIndex(0);
        return;
      }

      const searchLower = term.toLowerCase();
      const newMatches: typeof matches = [];

      currentDocument.paragraphs.forEach((paragraph) => {
        const content = paragraph.content.toLowerCase();
        const indices: number[] = [];
        let index = content.indexOf(searchLower);
        
        while (index !== -1) {
          indices.push(index);
          index = content.indexOf(searchLower, index + 1);
        }
        
        if (indices.length > 0) {
          newMatches.push({ paragraphId: paragraph.id, indices });
        }
      });

      setMatches(newMatches);
      setMatchIndex(0);
    }, 300),
    [currentDocument, setGlobalSearchTerm]
  );

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      // Clear search term when closing
      setSearchTerm('');
      setGlobalSearchTerm('');
      performSearch.cancel?.();
      setMatches([]);
      setMatchIndex(0);
    }
  }, [isOpen, setGlobalSearchTerm, performSearch]);

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      performSearch(searchTerm);
    } else {
      performSearch.cancel?.();
      setGlobalSearchTerm('');
      setMatches([]);
      setMatchIndex(0);
      setIsSearching(false);
    }
  }, [searchTerm, performSearch, setGlobalSearchTerm]);

  const navigateToMatch = (index: number) => {
    if (matches.length === 0) return;
    
    const match = matches[index];
    selectParagraph(match.paragraphId);
    
    // Scroll to paragraph
    const element = document.getElementById(`paragraph-${match.paragraphId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (matchIndex + 1) % matches.length;
    setMatchIndex(nextIndex);
    navigateToMatch(nextIndex);
  };

  const handlePrevious = () => {
    if (matches.length === 0) return;
    const prevIndex = matchIndex === 0 ? matches.length - 1 : matchIndex - 1;
    setMatchIndex(prevIndex);
    navigateToMatch(prevIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 bg-bg border border-border rounded-lg shadow-lg p-4 w-80"
        role="dialog"
        aria-label="Search document"
        aria-modal="false"
      >
        <div className="flex items-center gap-2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-secondary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-secondary" />
          )}
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-primary placeholder:text-muted"
            aria-label="Search in document"
            aria-live="polite"
            aria-busy={isSearching}
          />
          <div className="flex items-center gap-2 text-sm text-secondary">
            {!isSearching && matches.length > 0 && (
              <span aria-live="polite">{matchIndex + 1}/{matches.length}</span>
            )}
            {!isSearching && searchTerm && matches.length === 0 && (
              <span className="text-muted">No results</span>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-hover rounded transition-colors"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {matches.length > 0 && (
          <div className="mt-2 text-xs text-muted">
            Press Enter for next, Shift+Enter for previous
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}