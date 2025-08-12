/**
 * Text Highlighting Utility
 * Simple text highlighting for search functionality
 */

function HighlightedText({ text, searchTerm, highlightClassName = 'bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded' }) {
  if (!searchTerm || !text) {
    return text;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return React.createElement(
    'span',
    {},
    parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return React.createElement(
          'span',
          {
            key: index,
            className: highlightClassName,
            style: { backgroundColor: 'yellow', padding: '0 2px', borderRadius: '2px' }
          },
          part
        );
      }
      return part;
    })
  );
}

// Make available globally
window.HighlightedText = HighlightedText;