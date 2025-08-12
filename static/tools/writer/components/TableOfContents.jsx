// TableOfContents.jsx - Table of contents with clickable navigation
const { useState, useEffect, useMemo } = React;

// Simple icon components
const ChevronRightIcon = () => React.createElement('span', { style: { fontSize: '10px' } }, '▶');
const ChevronDownIcon = () => React.createElement('span', { style: { fontSize: '10px' } }, '▼');
const DocumentIcon = () => React.createElement('span', null, '📄');
const HeaderIcon = ({ level }) => {
  const icons = {
    1: '🔵', // H1
    2: '🟢', // H2  
    3: '🟡', // H3
    4: '🟠', // H4
    5: '🔴', // H5
    6: '🟣'  // H6
  };
  return React.createElement('span', { style: { fontSize: '12px' } }, icons[level] || '⚪');
};

/**
 * TableOfContents Component
 * Extracts headings from document and provides clickable navigation
 */
function TableOfContents({ document, style = {} }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [activeHeading, setActiveHeading] = useState(null);

  // Extract headings from document content
  const headings = useMemo(() => {
    if (!document || !document.paragraphs || document.paragraphs.length === 0) {
      return [];
    }

    const extractedHeadings = [];
    
    document.paragraphs.forEach((paragraph, index) => {
      if (!paragraph || !paragraph.content || typeof paragraph.content !== 'string') {
        return;
      }

      const content = paragraph.content.trim();
      
      // Match markdown headings (# ## ### etc.)
      const headingMatch = content.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        
        extractedHeadings.push({
          id: paragraph.id || `heading-${index}`,
          paragraphIndex: index,
          level,
          text,
          originalContent: content
        });
      }
    });
    
    return extractedHeadings;
  }, [document]);

  // Build hierarchical structure
  const hierarchicalHeadings = useMemo(() => {
    if (headings.length === 0) return [];

    const result = [];
    const stack = [];

    headings.forEach(heading => {
      // Pop stack until we find a parent or reach root
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const headingNode = {
        ...heading,
        children: [],
        parent: stack.length > 0 ? stack[stack.length - 1] : null
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(headingNode);
      } else {
        result.push(headingNode);
      }

      stack.push(headingNode);
    });

    return result;
  }, [headings]);

  // Scroll to heading
  const scrollToHeading = (heading) => {
    try {
      // Find the paragraph element by ID or index
      let paragraphElement = document.querySelector(`[data-paragraph-id="${heading.id}"]`);
      
      if (!paragraphElement) {
        // Fallback: find by paragraph index
        const allParagraphs = document.querySelectorAll('[data-paragraph-id]');
        if (allParagraphs[heading.paragraphIndex]) {
          paragraphElement = allParagraphs[heading.paragraphIndex];
        }
      }

      if (paragraphElement) {
        paragraphElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        setActiveHeading(heading.id);
        
        // Highlight the heading temporarily
        paragraphElement.style.backgroundColor = 'var(--accent)';
        setTimeout(() => {
          paragraphElement.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to scroll to heading:', error);
    }
  };

  // Toggle section expansion
  const toggleSection = (headingId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headingId)) {
        newSet.delete(headingId);
      } else {
        newSet.add(headingId);
      }
      return newSet;
    });
  };

  // Expand all sections by default if there aren't too many
  useEffect(() => {
    if (headings.length > 0 && headings.length <= 10 && expandedSections.size === 0) {
      setExpandedSections(new Set(headings.map(h => h.id)));
    }
  }, [headings]);

  // Render heading item
  const renderHeading = (heading, depth = 0) => {
    const hasChildren = heading.children && heading.children.length > 0;
    const isExpanded = expandedSections.has(heading.id);
    const isActive = activeHeading === heading.id;
    
    return React.createElement(
      'div',
      {
        key: heading.id,
        style: {
          marginBottom: '2px'
        }
      },
      
      // Heading item
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? 'var(--primary)' : 'var(--text-primary)',
            fontSize: '0.8125rem',
            lineHeight: '1.3',
            marginLeft: `${depth * 16}px`,
            transition: 'all 0.2s',
            border: isActive ? '1px solid var(--primary)' : '1px solid transparent'
          },
          onClick: () => scrollToHeading(heading),
          onMouseEnter: (e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
            }
          },
          onMouseLeave: (e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }
        },
        
        // Expand/collapse button for parent headings
        React.createElement(
          'button',
          {
            style: {
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              visibility: hasChildren ? 'visible' : 'hidden',
              width: '16px',
              justifyContent: 'center'
            },
            onClick: (e) => {
              e.stopPropagation();
              toggleSection(heading.id);
            },
            'aria-label': `${isExpanded ? 'Collapse' : 'Expand'} section`
          },
          isExpanded ? React.createElement(ChevronDownIcon) : React.createElement(ChevronRightIcon)
        ),
        
        // Heading level indicator
        React.createElement(HeaderIcon, { level: heading.level }),
        
        // Heading text
        React.createElement(
          'span',
          {
            style: {
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: heading.level <= 2 ? '500' : '400'
            },
            title: heading.text
          },
          heading.text
        ),
        
        // Level indicator (small text)
        React.createElement(
          'span',
          {
            style: {
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              opacity: 0.7,
              fontFamily: 'monospace'
            }
          },
          `H${heading.level}`
        )
      ),
      
      // Children (if expanded)
      hasChildren && isExpanded && React.createElement(
        'div',
        {
          style: {
            marginLeft: '8px'
          }
        },
        heading.children.map(child => renderHeading(child, depth + 1))
      )
    );
  };

  return React.createElement(
    'div',
    {
      className: 'table-of-contents',
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }
    },
    
    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border)'
        }
      },
      React.createElement(DocumentIcon),
      React.createElement(
        'h3',
        {
          style: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }
        },
        'Table of Contents'
      ),
      headings.length > 0 && React.createElement(
        'span',
        {
          style: {
            fontSize: '0.6875rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--background-secondary)',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: '500'
          }
        },
        headings.length
      )
    ),
    
    // Content
    React.createElement(
      'div',
      {
        style: {
          flex: 1,
          overflow: 'auto'
        }
      },
      
      // No headings state
      headings.length === 0 && React.createElement(
        'div',
        {
          style: {
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            lineHeight: '1.5'
          }
        },
        React.createElement(
          'div',
          { style: { marginBottom: '8px' } },
          '📝'
        ),
        React.createElement(
          'div',
          { style: { fontWeight: '500', marginBottom: '4px' } },
          'No headings found'
        ),
        React.createElement(
          'div',
          null,
          'Add headings with markdown syntax:'
        ),
        React.createElement(
          'div',
          { 
            style: { 
              marginTop: '8px', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem',
              color: 'var(--text-primary)'
            } 
          },
          '# Heading 1',
          React.createElement('br'),
          '## Heading 2',
          React.createElement('br'),
          '### Heading 3'
        )
      ),
      
      // Headings list
      hierarchicalHeadings.length > 0 && React.createElement(
        'div',
        {
          style: {
            paddingBottom: '16px'
          }
        },
        hierarchicalHeadings.map(heading => renderHeading(heading))
      )
    ),
    
    // Footer with controls
    headings.length > 0 && React.createElement(
      'div',
      {
        style: {
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '6px',
          fontSize: '0.6875rem'
        }
      },
      React.createElement(
        'button',
        {
          onClick: () => setExpandedSections(new Set(headings.map(h => h.id))),
          style: {
            padding: '4px 8px',
            backgroundColor: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.6875rem'
          },
          title: 'Expand all sections'
        },
        'Expand All'
      ),
      React.createElement(
        'button',
        {
          onClick: () => setExpandedSections(new Set()),
          style: {
            padding: '4px 8px',
            backgroundColor: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.6875rem'
          },
          title: 'Collapse all sections'
        },
        'Collapse All'
      )
    )
  );
}

// Export component
window.TableOfContents = TableOfContents;