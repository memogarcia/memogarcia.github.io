/**
 * EditorHeader Component - Migrated from TypeScript
 * Inline title editing with border visibility based on scroll
 */

const { useState, useEffect } = React;

function EditorHeader({ showBorders = true }) {
  const { currentDocument, updateDocumentTitle } = window.useWriterStore();
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(currentDocument?.title || '');
      setIsEditing(false);
    }
  };

  return React.createElement(
    'div',
    {
      className: showBorders ? 'border-b' : '',
      style: {
        borderBottom: showBorders ? '1px solid var(--border)' : 'none',
        backgroundColor: 'var(--background)'
      }
    },
    React.createElement(
      'div',
      {
        className: 'max-w-4xl mx-auto px-8 py-4',
        style: {
          maxWidth: '56rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '16px 32px'
        }
      },
      React.createElement(
        'div',
        {
          className: 'flex items-center justify-between',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        },
        React.createElement(
          'div',
          {
            className: 'flex-1',
            style: { flex: 1 }
          },
          isEditing
            ? React.createElement('input', {
                type: 'text',
                value: title,
                onChange: (e) => setTitle(e.target.value),
                onBlur: handleTitleSubmit,
                onKeyDown: handleKeyDown,
                className: 'text-2xl font-semibold bg-transparent border-b-2 outline-none font-sans',
                style: {
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  borderBottom: '2px solid rgba(16, 185, 129, 0.3)',
                  outline: 'none',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  color: 'var(--text-primary)',
                  width: '100%'
                },
                autoFocus: true,
                'aria-label': 'Document title'
              })
            : React.createElement(
                'h1',
                {
                  onClick: () => setIsEditing(true),
                  className: 'text-2xl font-semibold cursor-text hover:opacity-80 transition-opacity font-sans',
                  style: {
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'text',
                    transition: 'opacity 0.2s',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  },
                  title: 'Click to edit title'
                },
                currentDocument?.title
              )
        )
      )
    )
  );
}

// Make available globally
window.EditorHeader = EditorHeader;