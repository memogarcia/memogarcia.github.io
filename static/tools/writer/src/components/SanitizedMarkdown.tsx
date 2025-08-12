import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Components } from 'react-markdown';

interface SanitizedMarkdownProps {
  content: string;
  className?: string;
  components?: Components;
}

export function SanitizedMarkdown({ content, className, components }: SanitizedMarkdownProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'hr', 'kbd', 'mark', 'sub', 'sup', 'del', 'ins'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {sanitizedContent}
    </ReactMarkdown>
  );
}