import { useWriterStore } from '../store/local-store';
import { ListOrdered, Hash } from 'lucide-react';
import { cn } from '../utils/cn';

export function TableOfContents() {
  const { currentDocument, selectParagraph, selectedParagraphId } = useWriterStore();

  if (!currentDocument || currentDocument.paragraphs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <ListOrdered className="w-12 h-12 text-muted/50 mb-3" />
        <p className="text-muted font-medium mb-1">No content yet</p>
        <p className="text-sm text-muted/70">
          Your document outline will appear here
        </p>
      </div>
    );
  }

  // Extract headings from paragraphs
  const headings = currentDocument.paragraphs
    .map((paragraph, index) => {
      const lines = paragraph.content.split('\n');
      const firstLine = lines[0];
      
      // Check for markdown headings
      const headingMatch = firstLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        return {
          id: paragraph.id,
          level,
          text,
          index: index + 1,
        };
      }
      
      // For non-heading paragraphs, use first few words
      const preview = paragraph.content.slice(0, 50).replace(/\n/g, ' ');
      return {
        id: paragraph.id,
        level: 0,
        text: preview + (paragraph.content.length > 50 ? '...' : ''),
        index: index + 1,
      };
    });

  const handleClick = (paragraphId: string) => {
    selectParagraph(paragraphId);
    // Scroll to the paragraph
    const element = document.getElementById(`paragraph-${paragraphId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleClick(heading.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-hover",
              "flex items-start gap-2 group",
              selectedParagraphId === heading.id && "bg-hover"
            )}
            style={{
              paddingLeft: heading.level > 0 ? `${heading.level * 12 + 12}px` : '12px',
            }}
          >
            <span className="text-xs text-muted flex-shrink-0 pt-0.5">
              {heading.level > 0 ? (
                <Hash className="w-3 h-3" />
              ) : (
                heading.index
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                heading.level > 0 ? "font-medium text-primary" : "text-muted",
                heading.level === 1 && "text-base",
                selectedParagraphId === heading.id && "text-primary"
              )}
            >
              {heading.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}