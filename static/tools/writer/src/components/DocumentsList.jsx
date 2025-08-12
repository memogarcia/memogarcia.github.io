import React from 'react';
import { useWriterStore } from '../store/index.js';

export function DocumentsList({ onOpenSettings }) {
  const { documents, createDocument, selectDocument, currentDocument } = useWriterStore();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <button
          onClick={() => createDocument(`Document ${documents.length + 1}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-dark transition-colors"
        >
          ➕ New Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {documents.length === 0 ? (
          <div className="text-center text-muted py-8">
            <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '12px' }}>📄</div>
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Create your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => selectDocument(doc.id)}
                className={`group px-3 py-3 rounded-lg cursor-pointer transition-colors hover:bg-hover ${
                  currentDocument?.id === doc.id ? 'bg-hover' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary truncate">{doc.title}</h3>
                    <p className="text-xs text-muted mt-1">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted">
                      {doc.paragraphs?.length || 0} paragraphs
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {onOpenSettings && (
        <div className="p-4 border-t border-border">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
          >
            ⚙️ <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      )}
    </div>
  );
}