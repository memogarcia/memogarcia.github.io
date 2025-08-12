/**
 * Simple Markdown Renderer
 * Basic markdown rendering without external dependencies
 */

function SanitizedMarkdown({ content }) {
  if (!content) return '';

  // Simple markdown parsing
  let html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/__(.*?)__/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    // Code inline
    .replace(/`(.*?)`/gim, '<code style="background: var(--surface); padding: 2px 4px; border-radius: 3px; font-family: var(--font-mono);">$1</code>')
    // Line breaks
    .replace(/\n/gim, '<br>');

  return React.createElement('div', {
    className: 'markdown-content',
    dangerouslySetInnerHTML: { __html: html }
  });
}

// Make available globally
window.SanitizedMarkdown = SanitizedMarkdown;