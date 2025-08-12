/**
 * Local storage utilities for Writer app
 * Converted from TypeScript to JavaScript
 */

const STORAGE_KEYS = {
  DOCUMENTS: 'writer_documents',
  CURRENT_DOCUMENT_ID: 'writer_current_document_id',
  CLIPBOARD: 'writer_clipboard',
  THEME: 'writer_theme',
};

// Check if we're running in the browser
const isClient = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const storage = {
  // Documents
  saveDocuments: (documents) => {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  },
  
  loadDocuments: () => {
    if (!isClient) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!stored) return [];
    
    try {
      const documents = JSON.parse(stored);
      // Convert date strings back to Date objects
      return documents.map((doc) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        paragraphs: doc.paragraphs.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
      }));
    } catch {
      return [];
    }
  },
  
  // Current Document ID
  saveCurrentDocumentId: (id) => {
    if (!isClient) return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID);
    }
  },
  
  loadCurrentDocumentId: () => {
    if (!isClient) return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_DOCUMENT_ID);
  },
  
  // Clipboard
  saveClipboard: (clipboard) => {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.CLIPBOARD, JSON.stringify(clipboard));
  },
  
  loadClipboard: () => {
    if (!isClient) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.CLIPBOARD);
    if (!stored) return [];
    
    try {
      const clipboard = JSON.parse(stored);
      return clipboard.map((item) => ({
        ...item,
        savedAt: new Date(item.savedAt),
      }));
    } catch {
      return [];
    }
  },
  
  // Clear all data
  clearAll: () => {
    if (!isClient) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};

// Make available globally
window.storage = storage;