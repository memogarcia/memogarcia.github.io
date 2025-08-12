import { Document, Paragraph } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// Document API service
export const documentAPI = {
  // List all documents
  async list(): Promise<Document[]> {
    const response = await fetch(`${API_BASE}/api/documents`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ documents: any[] }>(response);
    
    // Transform backend documents to frontend format
    return data.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      paragraphs: [], // Will be loaded when document is selected
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  },

  // Get single document with content
  async get(id: string): Promise<Document> {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ document: any }>(response);
    
    // Parse the content from MinIO
    const fullData = data.document.fullData || {};
    const paragraphs: Paragraph[] = fullData.paragraphs || [];
    
    return {
      id: data.document.id,
      title: data.document.title,
      paragraphs,
      createdAt: data.document.createdAt,
      updatedAt: data.document.updatedAt,
    };
  },

  // Create new document
  async create(title: string, paragraphs: Paragraph[] = []): Promise<Document> {
    const response = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title,
        content: JSON.stringify({ paragraphs: paragraphs.length > 0 ? paragraphs : [] }), // Store paragraphs as JSON
        metadata: {
          paragraphCount: paragraphs.length,
        },
      }),
    });
    
    const data = await handleResponse<{ document: any }>(response);
    return {
      id: data.document.id,
      title: data.document.title,
      paragraphs: [], // Start with empty paragraphs, will be added separately
      createdAt: data.document.createdAt,
      updatedAt: data.document.updatedAt,
    };
  },

  // Update document
  async update(id: string, updates: { title?: string; paragraphs?: Paragraph[] }): Promise<Document> {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: updates.title,
        content: updates.paragraphs ? JSON.stringify({ paragraphs: updates.paragraphs }) : undefined,
        metadata: updates.paragraphs ? {
          paragraphCount: updates.paragraphs.length,
        } : undefined,
      }),
    });
    
    const data = await handleResponse<{ document: any }>(response);
    
    // Fetch the full document to get paragraphs
    return this.get(id);
  },

  // Delete document
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/documents?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse<{ success: boolean }>(response);
  },
};

// Simple auth service (without OAuth for now)
export const authAPI = {
  // Check if user is authenticated
  async check(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: 'include',
      });
      if (response.ok) {
        const session = await response.json();
        return { authenticated: !!session?.user, user: session?.user };
      }
      return { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  },

  // Simple login (you can implement this with email/password later)
  async login(email: string, password: string): Promise<{ user: any }> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ user: any }>(response);
  },

  // Logout
  async logout(): Promise<void> {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};