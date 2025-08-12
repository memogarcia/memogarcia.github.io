// ClipboardPanel.jsx - Clipboard management with drag & drop, search, and notes
const { useState, useEffect, useMemo } = React;

// Simple icon components
const PlusIcon = () => React.createElement('span', null, '+');
const SearchIcon = () => React.createElement('span', null, '🔍');
const DeleteIcon = () => React.createElement('span', null, '🗑');
const EditIcon = () => React.createElement('span', null, '✏️');
const SaveIcon = () => React.createElement('span', null, '💾');
const CancelIcon = () => React.createElement('span', null, '✕');
const DragIcon = () => React.createElement('span', null, '⋮⋮');

/**
 * ClipboardPanel Component
 * Manages clipboard items with notes, search, and drag & drop
 */
function ClipboardPanel({ style = {} }) {
  const [clipboardItems, setClipboardItems] = useState(() => {
    const saved = localStorage.getItem('writer-clipboard');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingNote, setEditingNote] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [showNewItem, setShowNewItem] = useState(false);

  // Get store functions
  const { addParagraph } = window.useWriterStore();
  const { toast } = window.useToast();

  // Save clipboard items to localStorage
  useEffect(() => {
    localStorage.setItem('writer-clipboard', JSON.stringify(clipboardItems));
  }, [clipboardItems]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return clipboardItems;
    
    const query = searchQuery.toLowerCase();
    return clipboardItems.filter(item => 
      item.content.toLowerCase().includes(query) ||
      (item.note && item.note.toLowerCase().includes(query))
    );
  }, [clipboardItems, searchQuery]);

  // Add a new clipboard item
  const addClipboardItem = (content, note = '') => {
    if (!content.trim()) return;
    
    const newItem = {
      id: Date.now() + Math.random(),
      content: content.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    
    setClipboardItems(prev => [newItem, ...prev]);
    
    toast({
      title: 'Item added to clipboard',
      description: 'Content saved for reuse',
      variant: 'success',
      duration: 2000
    });
  };

  // Remove a clipboard item
  const removeClipboardItem = (id) => {
    setClipboardItems(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: 'Item removed',
      description: 'Clipboard item deleted',
      variant: 'success',
      duration: 2000
    });
  };

  // Update a clipboard item's note
  const updateItemNote = (id, note) => {
    setClipboardItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, note: note.trim() } : item
      )
    );
    
    setEditingItem(null);
    setEditingNote('');
    
    toast({
      title: 'Note updated',
      description: 'Clipboard item updated',
      variant: 'success',
      duration: 2000
    });
  };

  // Use a clipboard item (add to document)
  const useClipboardItem = (item) => {
    try {
      addParagraph(item.content);
      
      // Increment usage count
      setClipboardItems(prev => 
        prev.map(clipItem => 
          clipItem.id === item.id 
            ? { ...clipItem, usageCount: (clipItem.usageCount || 0) + 1 }
            : clipItem
        )
      );
      
      toast({
        title: 'Content added',
        description: 'Clipboard content added to document',
        variant: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to add paragraph:', error);
      toast({
        title: 'Failed to add content',
        description: 'Could not add to document',
        variant: 'error'
      });
    }
  };

  // Handle new item creation
  const handleCreateNewItem = () => {
    if (newItemContent.trim()) {
      addClipboardItem(newItemContent);
      setNewItemContent('');
      setShowNewItem(false);
    }
  };

  // Handle drag and drop (simplified)
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.content);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return React.createElement(
    'div',
    {
      className: 'clipboard-panel',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }
    },
    
    // Header with search and add button
    React.createElement(
      'div',
      {
        style: {
          marginBottom: '16px'
        }
      },
      // Search input
      React.createElement(
        'div',
        {
          style: {
            position: 'relative',
            marginBottom: '12px'
          }
        },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search clipboard...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          style: {
            width: '100%',
            padding: '8px 32px 8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }
        }),
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none'
            }
          },
          React.createElement(SearchIcon)
        )
      ),
      
      // Add new item button
      React.createElement(
        'button',
        {
          onClick: () => setShowNewItem(true),
          style: {
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.2s'
          },
          title: 'Add new clipboard item'
        },
        React.createElement(PlusIcon),
        'New Item'
      )
    ),

    // New item creation form
    showNewItem && React.createElement(
      'div',
      {
        style: {
          padding: '12px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '16px'
        }
      },
      React.createElement('textarea', {
        value: newItemContent,
        onChange: (e) => setNewItemContent(e.target.value),
        placeholder: 'Enter content to save...',
        rows: 3,
        style: {
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          resize: 'vertical',
          marginBottom: '8px'
        }
      }),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            gap: '6px',
            justifyContent: 'flex-end'
          }
        },
        React.createElement(
          'button',
          {
            onClick: () => {
              setShowNewItem(false);
              setNewItemContent('');
            },
            style: {
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }
          },
          React.createElement(CancelIcon)
        ),
        React.createElement(
          'button',
          {
            onClick: handleCreateNewItem,
            disabled: !newItemContent.trim(),
            style: {
              padding: '4px 8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: newItemContent.trim() ? 'pointer' : 'not-allowed',
              opacity: newItemContent.trim() ? 1 : 0.5
            }
          },
          React.createElement(SaveIcon)
        )
      )
    ),

    // Items list
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          overflow: 'auto'
        }
      },
      
      // Empty state
      filteredItems.length === 0 && React.createElement(
        'div',
        {
          style: {
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }
        },
        searchQuery.trim() 
          ? `No items found for "${searchQuery}"`
          : 'No clipboard items yet. Add some content to reuse later!'
      ),

      // Items
      filteredItems.map(item =>
        React.createElement(
          'div',
          {
            key: item.id,
            className: 'clipboard-item',
            draggable: true,
            onDragStart: (e) => handleDragStart(e, item),
            style: {
              padding: '12px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              marginBottom: '8px',
              cursor: 'grab',
              transition: 'all 0.2s'
            },
            onMouseDown: (e) => {
              if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.currentTarget.style.cursor = 'grabbing';
              }
            },
            onMouseUp: (e) => {
              e.currentTarget.style.cursor = 'grab';
            }
          },
          
          // Drag handle
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }
            },
            React.createElement(
              'div',
              {
                style: {
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  marginTop: '2px'
                }
              },
              React.createElement(DragIcon)
            ),
            
            // Content area
            React.createElement(
              'div',
              {
                style: {
                  flex: 1,
                  minWidth: 0
                }
              },
              
              // Content
              React.createElement(
                'div',
                {
                  onClick: () => useClipboardItem(item),
                  style: {
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    lineHeight: '1.4',
                    wordWrap: 'break-word',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    position: 'relative'
                  },
                  title: 'Click to add to document'
                },
                item.content.length > 100 
                  ? item.content.substring(0, 100) + '...'
                  : item.content
              ),
              
              // Note (editable)
              editingItem === item.id ? React.createElement(
                'div',
                {
                  style: {
                    marginBottom: '8px'
                  }
                },
                React.createElement('input', {
                  type: 'text',
                  value: editingNote,
                  onChange: (e) => setEditingNote(e.target.value),
                  placeholder: 'Add a note...',
                  style: {
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem'
                  },
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      updateItemNote(item.id, editingNote);
                    } else if (e.key === 'Escape') {
                      setEditingItem(null);
                      setEditingNote('');
                    }
                  }
                }),
                React.createElement(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      gap: '4px',
                      marginTop: '4px'
                    }
                  },
                  React.createElement(
                    'button',
                    {
                      onClick: () => updateItemNote(item.id, editingNote),
                      style: {
                        padding: '2px 6px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }
                    },
                    'Save'
                  ),
                  React.createElement(
                    'button',
                    {
                      onClick: () => {
                        setEditingItem(null);
                        setEditingNote('');
                      },
                      style: {
                        padding: '2px 6px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }
                    },
                    'Cancel'
                  )
                )
              ) : item.note && React.createElement(
                'div',
                {
                  style: {
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    marginBottom: '8px',
                    wordWrap: 'break-word'
                  }
                },
                `Note: ${item.note}`
              ),
              
              // Metadata and actions
              React.createElement(
                'div',
                {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.6875rem',
                    color: 'var(--text-secondary)'
                  }
                },
                React.createElement(
                  'div',
                  null,
                  formatDate(item.createdAt),
                  item.usageCount > 0 && React.createElement('span', null, ` • Used ${item.usageCount}x`)
                ),
                React.createElement(
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
                      onClick: (e) => {
                        e.stopPropagation();
                        setEditingItem(item.id);
                        setEditingNote(item.note || '');
                      },
                      style: {
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '12px'
                      },
                      title: 'Edit note'
                    },
                    React.createElement(EditIcon)
                  ),
                  React.createElement(
                    'button',
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this clipboard item?')) {
                          removeClipboardItem(item.id);
                        }
                      },
                      style: {
                        background: 'none',
                        border: 'none',
                        color: 'var(--destructive)',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '12px'
                      },
                      title: 'Delete item'
                    },
                    React.createElement(DeleteIcon)
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Footer with tips
    clipboardItems.length > 0 && React.createElement(
      'div',
      {
        style: {
          marginTop: '12px',
          padding: '8px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '6px',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.3'
        }
      },
      '💡 Tip: Click items to add to document, drag to editor, or edit notes for organization'
    )
  );
}

// Export component
window.ClipboardPanel = ClipboardPanel;