import DOMPurify from 'isomorphic-dompurify';

/**
 * Input validation and sanitization utilities
 */

export const MAX_TITLE_LENGTH = 200;
export const MAX_PARAGRAPH_LENGTH = 10000;
export const MAX_DOCUMENT_SIZE = 1000000; // 1MB

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Validate and sanitize document title
 */
export function validateTitle(title: string): { isValid: boolean; sanitized: string; error?: string } {
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
 */
export function validateParagraph(content: string): { isValid: boolean; sanitized: string; error?: string } {
  // Allow markdown but sanitize HTML
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'br'],
    ALLOWED_ATTR: [],
  });
  
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
 */
export function validateImportedText(text: string): { isValid: boolean; error?: string } {
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
 */
export function validateClipboardNote(note: string): { isValid: boolean; sanitized: string; error?: string } {
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

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old timestamps outside the window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps = [];
  }
}