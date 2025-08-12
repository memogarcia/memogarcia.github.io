// Validation utilities
export function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { isValid: false, sanitized: '', error: 'Title is required' };
  }
  
  const sanitized = title.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Title cannot be empty' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, sanitized: sanitized.substring(0, 100), error: 'Title too long' };
  }
  
  return { isValid: true, sanitized, error: null };
}

export function validateParagraph(content) {
  if (typeof content !== 'string') {
    return { isValid: false, sanitized: '', error: 'Content must be a string' };
  }
  
  // Allow empty content (for empty paragraphs)
  const sanitized = content.trim();
  
  if (sanitized.length > 5000) {
    return { isValid: false, sanitized: sanitized.substring(0, 5000), error: 'Content too long' };
  }
  
  return { isValid: true, sanitized, error: null };
}