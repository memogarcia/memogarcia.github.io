import React from 'react';

export interface HighlightTextProps {
  text: string;
  searchTerm: string;
  highlightClassName?: string;
}

export function highlightText({ text, searchTerm, highlightClassName = 'bg-yellow-300 dark:bg-yellow-600' }: HighlightTextProps): React.ReactNode {
  if (!searchTerm || searchTerm.trim() === '') {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function HighlightedText({ text, searchTerm, highlightClassName }: HighlightTextProps) {
  return <>{highlightText({ text, searchTerm, highlightClassName })}</>;
}