/**
 * Smart Text Parser - Converts from TypeScript textParser.ts
 * Intelligently splits text content into meaningful paragraphs
 */

function smartSplitParagraphs(content) {
  // Remove carriage returns and normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Try different splitting strategies
  let paragraphs = [];
  
  // Strategy 1: Split by double newlines (most common in markdown and plain text)
  const doubleNewlineSplit = normalizedContent.split(/\n\s*\n+/);
  
  if (doubleNewlineSplit.length > 1) {
    paragraphs = doubleNewlineSplit;
  } else {
    // Strategy 2: Look for patterns that indicate paragraph breaks
    
    // Check if content has markdown headers
    const hasMarkdownHeaders = /^#{1,6}\s+/m.test(normalizedContent);
    
    // Check if content has numbered lists
    const hasNumberedLists = /^\d+\.\s+/m.test(normalizedContent);
    
    // Check if content has bullet points
    const hasBulletPoints = /^[\*\-\+]\s+/m.test(normalizedContent);
    
    if (hasMarkdownHeaders || hasNumberedLists || hasBulletPoints) {
      // Split by single newlines but keep list items and headers together
      const lines = normalizedContent.split('\n');
      let currentParagraph = '';
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';
        
        // Check if this line is a header
        const isHeader = /^#{1,6}\s+/.test(trimmedLine);
        
        // Check if this line is a list item
        const isListItem = /^[\*\-\+\d]+[\.\)]\s+/.test(trimmedLine);
        
        // Check if next line is a list item or header
        const nextIsSpecial = /^(#{1,6}\s+|[\*\-\+\d]+[\.\)]\s+)/.test(nextLine);
        
        if (isHeader && currentParagraph) {
          // Save current paragraph and start new with header
          paragraphs.push(currentParagraph.trim());
          currentParagraph = line;
        } else if (isListItem) {
          // Add to current paragraph
          currentParagraph += (currentParagraph ? '\n' : '') + line;
        } else if (trimmedLine === '' && currentParagraph) {
          // Empty line - end current paragraph
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        } else if (trimmedLine) {
          // Regular line
          if (currentParagraph && !isListItem && !nextIsSpecial && 
              currentParagraph.length > 300) {
            // If paragraph is getting long and next line isn't special, split here
            paragraphs.push(currentParagraph.trim());
            currentParagraph = line;
          } else {
            currentParagraph += (currentParagraph ? '\n' : '') + line;
          }
        }
      });
      
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }
    } else {
      // Strategy 3: Split by single newlines but group short lines
      const lines = normalizedContent.split('\n');
      let currentParagraph = '';
      
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '') {
          if (currentParagraph) {
            paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
        } else if (trimmedLine.length < 50 && currentParagraph) {
          // Short line - likely continuation
          currentParagraph += ' ' + trimmedLine;
        } else if (currentParagraph.length > 500) {
          // Paragraph getting too long, split here
          paragraphs.push(currentParagraph.trim());
          currentParagraph = trimmedLine;
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
        }
      });
      
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }
    }
  }
  
  // Final processing: split very long paragraphs at sentence boundaries
  const finalParagraphs = [];
  
  paragraphs.forEach(para => {
    const trimmedPara = para.trim();
    if (!trimmedPara) return;
    
    if (trimmedPara.length > 1000) {
      // Split at sentence endings
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+\s*/g) || [trimmedPara];
      let currentChunk = '';
      
      sentences.forEach(sentence => {
        if (currentChunk.length + sentence.length > 600) {
          if (currentChunk) finalParagraphs.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      });
      
      if (currentChunk) finalParagraphs.push(currentChunk.trim());
    } else {
      finalParagraphs.push(trimmedPara);
    }
  });
  
  return finalParagraphs.filter(p => p.length > 0);
}

// Make available globally
window.smartSplitParagraphs = smartSplitParagraphs;