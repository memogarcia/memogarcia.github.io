import React from 'react';

export function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-bg border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-primary mb-2">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Search</span>
                  <kbd className="bg-hover px-2 py-1 rounded text-xs">Ctrl+F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Focus Mode</span>
                  <kbd className="bg-hover px-2 py-1 rounded text-xs">Ctrl+Shift+F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Toggle Sidebars</span>
                  <kbd className="bg-hover px-2 py-1 rounded text-xs">Ctrl+← / Ctrl+→</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Undo / Redo</span>
                  <kbd className="bg-hover px-2 py-1 rounded text-xs">Ctrl+Z / Ctrl+Y</kbd>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-primary mb-2">About</h3>
              <p className="text-sm text-secondary">
                Writer v1.0 - A structured writing tool for organizing your thoughts and creating well-structured documents.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}