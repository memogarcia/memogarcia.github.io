import { Document } from '../types';

export function exportToMarkdown(document: Document): void {
  if (!document) return;

  // Combine all paragraphs with double newlines
  const content = document.paragraphs
    .map(paragraph => paragraph.content)
    .join('\n\n');

  // Add title as markdown header
  const markdown = `# ${document.title}\n\n${content}`;

  // Create a blob with the markdown content
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  
  // Trigger download
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}