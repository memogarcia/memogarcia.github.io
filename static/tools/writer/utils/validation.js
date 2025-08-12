/**
 * Input validation and sanitization utilities
 * Converted from TypeScript to JavaScript
 * Note: DOMPurify removed for simplicity - using basic sanitization
 */

const MAX_TITLE_LENGTH = 200;
const MAX_PARAGRAPH_LENGTH = 10000;
const MAX_DOCUMENT_SIZE = 1000000; // 1MB

/**
 * Basic sanitize user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and scripts
  let cleaned = input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Validate and sanitize document title
 * @param {string} title - The title to validate
 * @returns {{ isValid: boolean, sanitized: string, error?: string }} - Validation result
 */
function validateTitle(title) {
  const sanitized = sanitizeInput(title);
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Title cannot be empty' };
  }
  
  if (sanitized.length > MAX_TITLE_LENGTH) {
    return { 
      isValid: false, 
      sanitized: sanitized.substring(0, MAX_TITLE_LENGTH), 
      error: `Title must be less than ${MAX_TITLE_LENGTH} characters` 
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize paragraph content
 * @param {string} content - The content to validate
 * @returns {{ isValid: boolean, sanitized: string, error?: string }} - Validation result
 */
function validateParagraph(content) {
  if (typeof content !== 'string') {
    return { isValid: true, sanitized: '' };
  }
  
  // Basic sanitization - allow common formatting
  const sanitized = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  if (sanitized.length > MAX_PARAGRAPH_LENGTH) {
    return { 
      isValid: false, 
      sanitized: sanitized.substring(0, MAX_PARAGRAPH_LENGTH), 
      error: `Paragraph must be less than ${MAX_PARAGRAPH_LENGTH} characters` 
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate imported text
 * @param {string} text - The text to validate
 * @returns {{ isValid: boolean, error?: string }} - Validation result
 */
function validateImportedText(text) {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Imported text cannot be empty' };
  }
  
  if (text.length > MAX_DOCUMENT_SIZE) {
    return { isValid: false, error: `Document size exceeds maximum of ${MAX_DOCUMENT_SIZE / 1000}KB` };
  }
  
  // Check for potential malicious patterns
  const suspiciousPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, error: 'Imported text contains potentially unsafe content' };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate and sanitize clipboard content
 * @param {string} note - The note to validate
 * @returns {{ isValid: boolean, sanitized: string, error?: string }} - Validation result
 */
function validateClipboardNote(note) {
  const sanitized = sanitizeInput(note);
  const maxNoteLength = 500;
  
  if (sanitized.length > maxNoteLength) {
    return { 
      isValid: false, 
      sanitized: sanitized.substring(0, maxNoteLength), 
      error: `Note must be less than ${maxNoteLength} characters` 
    };
  }
  
  return { isValid: true, sanitized };
}

// Make available globally
window.validateTitle = validateTitle;
window.validateParagraph = validateParagraph;
window.validateImportedText = validateImportedText;
window.validateClipboardNote = validateClipboardNote;
window.sanitizeInput = sanitizeInput;
window.MAX_TITLE_LENGTH = MAX_TITLE_LENGTH;
window.MAX_PARAGRAPH_LENGTH = MAX_PARAGRAPH_LENGTH;
window.MAX_DOCUMENT_SIZE = MAX_DOCUMENT_SIZE;