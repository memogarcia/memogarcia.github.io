// SearchBar.jsx - Floating search dialog with real-time search capabilities
const { useState, useEffect, useRef, useMemo } = React;

// Simple icon components
const SearchIcon = () => React.createElement('span', null, '🔍');
const CloseIcon = () => React.createElement('span', null, '✕');
const ArrowUpIcon = () => React.createElement('span', null, '↑');
const ArrowDownIcon = () => React.createElement('span', null, '↓');

/**
 * SearchBar Component
 * Floating search dialog with real-time search, match navigation, and keyboard shortcuts
 */
function SearchBar({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matches, setMatches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Get store state
  const { currentDocument } = window.useWriterStore();
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search function
  const performSearch = useMemo(() => {
    if (!window.debounce) {
      // Fallback debounce if utility not available
      return (callback, delay) => {
        return (...args) => {
          clearTimeout(searchTimeout.current);
          searchTimeout.current = setTimeout(() => callback(...args), delay);
        };
      };
    }
    return window.debounce;
  }, []);

  // Search through document content
  const searchDocument = useMemo(() => 
    performSearch((searchQuery) => {
      if (!searchQuery.trim() || !currentDocument || !currentDocument.paragraphs) {
        setMatches([]);
        setCurrentMatch(0);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        const results = [];
        const searchTerms = searchQuery.toLowerCase().split(/\s+/);
        
        currentDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
          if (!paragraph || typeof paragraph.content !== 'string') return;
          
          const content = paragraph.content.toLowerCase();
          const originalContent = paragraph.content;
          
          // Check if all search terms exist in this paragraph
          const hasAllTerms = searchTerms.every(term => content.includes(term));
          
          if (hasAllTerms) {
            // Find exact positions for highlighting
            searchTerms.forEach(term => {
              let startIndex = 0;
              let index;
              
              while ((index = content.indexOf(term, startIndex)) !== -1) {
                results.push({
                  paragraphIndex,
                  paragraphId: paragraph.id,
                  startIndex: index,
                  endIndex: index + term.length,
                  term: term,
                  context: originalContent.substring(
                    Math.max(0, index - 30), 
                    Math.min(originalContent.length, index + term.length + 30)
                  ),
                  fullContent: originalContent
                });
                startIndex = index + 1;
              }
            });
          }
        });

        // Sort results by paragraph order, then by position within paragraph
        results.sort((a, b) => {
          if (a.paragraphIndex !== b.paragraphIndex) {
            return a.paragraphIndex - b.paragraphIndex;
          }
          return a.startIndex - b.startIndex;
        });

        setMatches(results);
        setCurrentMatch(results.length > 0 ? 1 : 0);
      } catch (error) {
        console.error('Search error:', error);
        setMatches([]);
        setCurrentMatch(0);
      } finally {
        setIsSearching(false);
      }
    }, 300), [currentDocument, performSearch]
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchDocument(value);
  };

  // Navigate to next match
  const goToNextMatch = () => {
    if (matches.length === 0) return;
    const next = currentMatch >= matches.length ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    scrollToMatch(matches[next - 1]);
  };

  // Navigate to previous match
  const goToPreviousMatch = () => {
    if (matches.length === 0) return;
    const prev = currentMatch <= 1 ? matches.length : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(matches[prev - 1]);
  };

  // Scroll to a specific match
  const scrollToMatch = (match) => {
    if (!match) return;
    
    try {
      // Find the paragraph element
      const paragraphElement = document.querySelector(`[data-paragraph-id="${match.paragraphId}"]`);
      if (paragraphElement) {
        paragraphElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // Highlight the paragraph temporarily
        paragraphElement.style.backgroundColor = 'var(--accent)';
        setTimeout(() => {
          paragraphElement.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to scroll to match:', error);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            goToPreviousMatch();
          } else {
            goToNextMatch();
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            goToNextMatch();
          }
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            goToPreviousMatch();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, matches, currentMatch, onClose]);

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMatches([]);
      setCurrentMatch(0);
      setIsSearching(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return React.createElement(
    'div',
    {
      className: 'search-overlay',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        paddingTop: '10vh'
      },
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }
    },
    React.createElement(
      'div',
      {
        className: 'search-dialog',
        style: {
          backgroundColor: 'var(--background)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border)',
          width: '90%',
          maxWidth: '500px',
          animation: 'slideDown 0.2s ease-out'
        },
        onClick: (e) => e.stopPropagation()
      },
      
      // Header with search input
      React.createElement(
        'div',
        {
          style: {
            padding: '20px',
            borderBottom: matches.length > 0 ? '1px solid var(--border)' : 'none'
          }
        },
        React.createElement(
          'div',
          {
            style: {
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }
          },
          // Search icon
          React.createElement(
            'div',
            {
              style: {
                color: 'var(--text-secondary)',
                fontSize: '18px'
              }
            },
            React.createElement(SearchIcon)
          ),
          
          // Input
          React.createElement('input', {
            ref: inputRef,
            type: 'text',
            value: query,
            onChange: handleInputChange,
            placeholder: 'Search in document...',
            style: {
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
              padding: '8px 0'
            },
            'aria-label': 'Search input'
          }),
          
          // Match counter
          matches.length > 0 && React.createElement(
            'div',
            {
              style: {
                fontSize: '14px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }
            },
            `${currentMatch} of ${matches.length}`
          ),
          
          // Navigation buttons
          matches.length > 0 && React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                gap: '4px'
              }
            },
            React.createElement(
              'button',
              {
                onClick: goToPreviousMatch,
                style: {
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  transition: 'color 0.2s'
                },
                title: 'Previous match (Shift + Enter)'
              },
              React.createElement(ArrowUpIcon)
            ),
            React.createElement(
              'button',
              {
                onClick: goToNextMatch,
                style: {
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  transition: 'color 0.2s'
                },
                title: 'Next match (Enter)'
              },
              React.createElement(ArrowDownIcon)
            )
          ),
          
          // Close button
          React.createElement(
            'button',
            {
              onClick: onClose,
              style: {
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'color 0.2s'
              },
              'aria-label': 'Close search'
            },
            React.createElement(CloseIcon)
          )
        )
      ),
      
      // Results or status
      query.trim() && React.createElement(
        'div',
        {
          style: {
            padding: '16px 20px',
            borderTop: matches.length > 0 ? '1px solid var(--border)' : 'none'
          }
        },
        
        // Loading state
        isSearching && React.createElement(
          'div',
          {
            style: {
              color: 'var(--text-secondary)',
              fontSize: '14px',
              textAlign: 'center',
              padding: '8px'
            }
          },
          'Searching...'
        ),
        
        // No results
        !isSearching && matches.length === 0 && React.createElement(
          'div',
          {
            style: {
              color: 'var(--text-secondary)',
              fontSize: '14px',
              textAlign: 'center',
              padding: '8px'
            }
          },
          `No results found for "${query}"`
        ),
        
        // Has results - show keyboard shortcuts
        !isSearching && matches.length > 0 && React.createElement(
          'div',
          {
            style: {
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }
          },
          React.createElement('div', null, '• Press Enter to go to next match'),
          React.createElement('div', null, '• Press Shift + Enter to go to previous match'),
          React.createElement('div', null, '• Press Escape to close')
        )
      )
    ),
    
    // Add CSS animation
    React.createElement('style', {
      dangerouslySetInnerHTML: {
        __html: `
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }
    })
  );
}

// Export component
window.SearchBar = SearchBar;