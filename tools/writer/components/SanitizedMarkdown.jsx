// SanitizedMarkdown.jsx - Simple markdown renderer for preview mode
const { useMemo } = React;

/**
 * Simple and safe markdown renderer for preview mode
 * Handles basic markdown syntax without external dependencies
 */
function SanitizedMarkdown({ content, className, ...props }) {
  const renderedContent = useMemo(() => {
    if (!content || typeof content !== 'string') return '';
    
    // Simple markdown-to-HTML conversion
    let html = content
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      
      // Headers (must come before bold/italic)
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      
      // Lists (simple implementation)
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li>.*?<\/li>)/g, (match) => {
      if (!match.includes('<ul>')) {
        return '<ul>' + match + '</ul>';
      }
      return match;
    });
    
    // Clean up multiple consecutive tags
    html = html.replace(/<\/p><p>/g, '</p>\n<p>')
               .replace(/<\/blockquote><blockquote>/g, '<br>')
               .replace(/<\/ul><ul>/g, '');
    
    return html;
  }, [content]);
  
  const markdownStyles = {
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontFamily: 'var(--font-system, system-ui, -apple-system, sans-serif)'
  };

  const inlineStyles = `
    .markdown-content h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 1.5rem 0 1rem 0;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .markdown-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem 0;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .markdown-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem 0;
      color: var(--text-primary);
      line-height: 1.4;
    }
    .markdown-content p {
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }
    .markdown-content strong {
      font-weight: 600;
      color: var(--text-primary);
    }
    .markdown-content em {
      font-style: italic;
      color: var(--text-secondary);
    }
    .markdown-content code {
      background: var(--background-secondary);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
      color: var(--text-primary);
    }
    .markdown-content pre {
      background: var(--background-secondary);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid var(--border);
    }
    .markdown-content pre code {
      background: none;
      padding: 0;
      font-size: 0.875rem;
    }
    .markdown-content blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
      color: var(--text-secondary);
    }
    .markdown-content ul {
      list-style-type: disc;
      padding-left: 1.5rem;
      margin: 1rem 0;
    }
    .markdown-content ol {
      list-style-type: decimal;
      padding-left: 1.5rem;
      margin: 1rem 0;
    }
    .markdown-content li {
      margin: 0.25rem 0;
      line-height: 1.5;
    }
    .markdown-content a {
      color: var(--primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .markdown-content a:hover {
      text-decoration: none;
    }
  `;

  // Add styles to document head if not already added
  React.useEffect(() => {
    const styleId = 'markdown-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = inlineStyles;
      document.head.appendChild(style);
    }
  }, []);

  return React.createElement('div', {
    className: window.cn && window.cn('markdown-content', className),
    style: {
      ...markdownStyles,
      ...(props.style || {})
    },
    dangerouslySetInnerHTML: { __html: renderedContent },
    ...props
  });
}

// Export component
window.SanitizedMarkdown = SanitizedMarkdown;