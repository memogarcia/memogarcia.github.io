/**
 * DocumentsList Component - Migrated from TypeScript  
 * Document CRUD operations with import/export and speech input functionality
 */

const { useState } = React;

// Simple icon components
const Plus = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '➕');
const FileText = ({ className }) => React.createElement('span', { className, style: { fontSize: '48px', opacity: 0.5 } }, '📄');
const Trash2 = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '🗑️');
const Upload = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '📤');
const Loader2 = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '⏳');
const Download = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '💾');
const Settings = ({ className }) => React.createElement('span', { className, style: { fontSize: '16px' } }, '⚙️');

// Simple date formatter (fallback if date-fns not available)
function formatDate(date) {
  if (window.dateFns && window.dateFns.format) {
    try {
      return window.dateFns.format(date, 'MMM d, yyyy');
    } catch (e) {
      // Fallback to simple date formatting
    }
  }
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// ClientOnly component for date rendering
function ClientOnly({ fallback, children }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return fallback || null;
  }
  
  return children;
}

function DocumentsList({ onOpenSettings }) {
  const {
    documents,
    currentDocument,
    createDocument,
    selectDocument,
    deleteDocument
  } = window.useWriterStore();
  
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateDocument = () => {
    createDocument(`Document ${documents.length + 1}`);
  };

  const handleDeleteDocument = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target ? event.target.result : null;
      
      // Use smart paragraph splitting
      const paragraphs = window.smartSplitParagraphs(content);
      
      if (paragraphs.length > 0) {
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
          const newDocument = await createDocument(title);
          
          if (!newDocument) {
            throw new Error('Failed to create document');
          }
          
          // Wait a moment for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get store state and add paragraphs
          const store = window.useWriterStore();
          const { addParagraph } = store;
          
          // Add each paragraph sequentially
          for (const paragraph of paragraphs) {
            await addParagraph(paragraph);
            // Small delay between paragraphs to ensure order
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Show success toast if available
          if (window.useToast) {
            const { toast } = window.useToast();
            toast({
              title: 'Import successful',
              description: `Imported ${paragraphs.length} paragraphs from ${file.name}`,
              variant: 'success',
            });
          }
        } catch (error) {
          console.error('Import error:', error);
          if (window.useToast) {
            const { toast } = window.useToast();
            toast({
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
        if (window.useToast) {
          const { toast } = window.useToast();
          toast({
            title: 'Import failed',
            description: 'No paragraphs found in the file.',
            variant: 'error',
          });
        }
      }
    };
    
    reader.onerror = () => {
      setIsImporting(false);
      if (window.useToast) {
        const { toast } = window.useToast();
        toast({
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

  return React.createElement(
    'div',
    {
      className: 'h-full flex flex-col',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }
    },
    React.createElement(
      'div',
      {
        className: 'p-4 space-y-2',
        style: {
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }
      },
      React.createElement(
        'button',
        {
          onClick: handleCreateDocument,
          className: 'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-sans',
          style: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: 'none',
            cursor: 'pointer'
          },
          'aria-label': 'Create new document',
          onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
          }
        },
        React.createElement(Plus, { className: 'w-4 h-4', 'aria-hidden': 'true' }),
        'New Document'
      ),
      
      React.createElement(
        'div',
        {
          className: 'flex gap-2',
          style: { display: 'flex', gap: '8px' }
        },
        React.createElement(
          'label',
          {
            className: 'flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors font-sans',
            style: {
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              backgroundColor: 'transparent'
            },
            'aria-label': isImporting ? 'Importing document...' : 'Import document from file',
            onMouseEnter: (e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }
          },
          isImporting 
            ? React.createElement(
                React.Fragment,
                {},
                React.createElement(Loader2, { className: 'w-4 h-4', 'aria-hidden': 'true' }),
                React.createElement('span', {}, 'Importing...')
              )
            : React.createElement(
                React.Fragment,
                {},
                React.createElement(Upload, { className: 'w-4 h-4', 'aria-hidden': 'true' }),
                React.createElement('span', {}, 'Import')
              ),
          React.createElement('input', {
            type: 'file',
            accept: '.txt,.md,.markdown',
            onChange: handleImport,
            className: 'hidden',
            style: { display: 'none' },
            disabled: isImporting,
            'aria-describedby': 'file-upload-help'
          })
        ),
        
        React.createElement(window.SpeechInput, {
          onTranscript: (text) => {
            // Create a new document with speech input
            const title = `Voice Note ${new Date().toLocaleTimeString()}`;
            createDocument(title);
            
            // Wait for document creation then add the text as paragraphs
            setTimeout(() => {
              const store = window.useWriterStore();
              const { addParagraph } = store;
              const paragraphs = window.smartSplitParagraphs(text);
              paragraphs.forEach(async (paragraph) => {
                await addParagraph(paragraph);
              });
              
              if (window.useToast) {
                const { toast } = window.useToast();
                toast({
                  title: 'Voice input added',
                  description: `Created document with ${paragraphs.length} paragraph(s)`,
                  variant: 'success',
                });
              }
            }, 100);
          },
          className: 'px-4 py-2 border rounded-lg transition-colors'
        })
      ),
      React.createElement(
        'div',
        {
          id: 'file-upload-help',
          className: 'sr-only',
          style: {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0'
          }
        },
        'Upload text files (.txt, .md, .markdown) to import as new documents'
      )
    ),

    React.createElement(
      'div',
      {
        className: 'flex-1 overflow-y-auto px-2 pb-4',
        style: {
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px 16px 8px'
        }
      },
      documents.length === 0 
        ? React.createElement(
            'div',
            {
              className: 'text-center py-8 px-4',
              style: {
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-secondary)'
              },
              role: 'status',
              'aria-label': 'No documents available'
            },
            React.createElement(FileText, { className: 'w-12 h-12 mx-auto mb-3', 'aria-hidden': 'true' }),
            React.createElement(
              'p',
              {
                className: 'text-sm',
                style: { fontSize: '0.875rem', marginBottom: '4px' }
              },
              'No documents yet'
            ),
            React.createElement(
              'p',
              {
                className: 'text-xs mt-1',
                style: { fontSize: '0.75rem', marginTop: '4px' }
              },
              'Create your first document to get started'
            )
          )
        : React.createElement(
            'nav',
            {
              'aria-label': 'Documents list',
              role: 'navigation'
            },
            React.createElement(
              'div',
              {
                className: 'space-y-1',
                style: { display: 'flex', flexDirection: 'column', gap: '4px' },
                role: 'list'
              },
              documents.map((doc) => 
                React.createElement(
                  'div',
                  {
                    key: doc.id,
                    onClick: () => selectDocument(doc.id),
                    className: window.cn(
                      'group px-3 py-3 rounded-lg cursor-pointer transition-colors hover:bg-hover',
                      currentDocument?.id === doc.id && 'bg-hover'
                    ),
                    style: {
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: currentDocument?.id === doc.id ? 'var(--surface)' : 'transparent'
                    },
                    role: 'listitem',
                    tabIndex: 0,
                    'aria-label': `Select document: ${doc.title}`,
                    'aria-selected': currentDocument?.id === doc.id,
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectDocument(doc.id);
                      }
                    },
                    onMouseEnter: (e) => {
                      if (currentDocument?.id !== doc.id) {
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }
                    },
                    onMouseLeave: (e) => {
                      if (currentDocument?.id !== doc.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }
                  },
                React.createElement(
                  'div',
                  {
                    className: 'flex items-start justify-between gap-2',
                    style: {
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }
                  },
                  React.createElement(
                    'div',
                    {
                      className: 'flex-1 min-w-0',
                      style: {
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden'
                      }
                    },
                    React.createElement(
                      'h3',
                      {
                        className: 'font-medium truncate font-sans',
                        style: {
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          margin: 0
                        }
                      },
                      doc.title
                    ),
                    React.createElement(
                      ClientOnly,
                      {
                        fallback: React.createElement(
                          'p',
                          {
                            className: 'text-xs mt-1',
                            style: {
                              fontSize: '0.75rem',
                              marginTop: '4px',
                              color: 'var(--text-secondary)'
                            }
                          },
                          '...'
                        )
                      },
                      React.createElement(
                        'p',
                        {
                          className: 'text-xs mt-1',
                          style: {
                            fontSize: '0.75rem',
                            marginTop: '4px',
                            color: 'var(--text-secondary)'
                          }
                        },
                        formatDate(doc.updatedAt)
                      )
                    ),
                    React.createElement(
                      'p',
                      {
                        className: 'text-xs',
                        style: {
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          margin: 0
                        }
                      },
                      `${doc.paragraphs.length} paragraphs`
                    )
                  ),
                  React.createElement(
                    'div',
                    {
                      className: 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      },
                      role: 'group',
                      'aria-label': 'Document actions',
                      onMouseEnter: (e) => {
                        e.currentTarget.style.opacity = '1';
                      }
                    },
                    React.createElement(
                      'button',
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          window.exportToMarkdown(doc);
                        },
                        className: 'p-1 hover:bg-hover rounded',
                        style: {
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          transition: 'background-color 0.2s'
                        },
                        'aria-label': `Export document: ${doc.title}`,
                        title: 'Export document',
                        onMouseEnter: (e) => {
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      },
                      React.createElement(Download, { className: 'w-4 h-4', 'aria-hidden': 'true' })
                    ),
                    React.createElement(
                      'button',
                      {
                        onClick: (e) => handleDeleteDocument(doc.id, e),
                        className: 'p-1 hover:bg-hover rounded',
                        style: {
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#ef4444',
                          transition: 'background-color 0.2s'
                        },
                        'aria-label': `Delete document: ${doc.title}`,
                        title: 'Delete document',
                        onMouseEnter: (e) => {
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      },
                      React.createElement(Trash2, { className: 'w-4 h-4', 'aria-hidden': 'true' })
                    )
                  )
                )
              )
              )
            )
          )
    ),
    
    // Settings button at bottom
    React.createElement(
      'div',
      {
        className: 'p-4 border-t',
        style: {
          padding: '16px',
          borderTop: '1px solid var(--border)'
        }
      },
      React.createElement(
        'button',
        {
          onClick: onOpenSettings,
          className: 'w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
          style: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            transition: 'color 0.2s, background-color 0.2s',
            cursor: 'pointer'
          },
          'aria-label': 'Open settings',
          onMouseEnter: (e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--surface)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        },
        React.createElement(Settings, { className: 'w-4 h-4', 'aria-hidden': 'true' }),
        React.createElement(
          'span',
          {
            className: 'text-sm font-medium',
            style: {
              fontSize: '0.875rem',
              fontWeight: '500'
            }
          },
          'Settings'
        )
      )
    )
  );
}

// Make available globally
window.DocumentsList = DocumentsList;