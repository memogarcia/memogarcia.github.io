import { useState } from 'react';
import { X, Settings, Palette, Keyboard, Info, LogOut, User, Sun, Moon, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useWriterStore } from '../store/local-store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'keyboard' | 'about' | 'account';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { theme, setTheme } = useTheme();
  const { userInfo, logout, editorSettings, updateEditorSettings } = useWriterStore();
  const [localFontSize, setLocalFontSize] = useState(editorSettings?.fontSize || 16);
  const [localFontFamily, setLocalFontFamily] = useState(editorSettings?.fontFamily || 'system-ui, -apple-system, sans-serif');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'keyboard' as const, label: 'Keyboard', icon: Keyboard },
    { id: 'about' as const, label: 'About', icon: Info },
    { id: 'account' as const, label: 'Account', icon: User },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bg border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-semibold text-primary">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>

          <div className="flex h-[500px]">
            {/* Sidebar */}
            <div className="w-56 border-r border-border bg-bg-secondary p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-hover text-primary'
                          : 'text-secondary hover:bg-hover/50 hover:text-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary">Auto-save</p>
                          <p className="text-sm text-muted">Automatically save changes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-bg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary">Word wrap</p>
                          <p className="text-sm text-muted">Wrap long lines in editor</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-bg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">Appearance</h3>
                    <div className="space-y-6">
                      <div>
                        <p className="font-medium text-primary mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === 'light'
                                ? 'border-accent bg-hover'
                                : 'border-border hover:border-secondary'
                            }`}
                          >
                            <Sun className="w-6 h-6 mx-auto mb-2 text-secondary" />
                            <span className="text-sm text-secondary">Light</span>
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === 'dark'
                                ? 'border-accent bg-hover'
                                : 'border-border hover:border-secondary'
                            }`}
                          >
                            <Moon className="w-6 h-6 mx-auto mb-2 text-secondary" />
                            <span className="text-sm text-secondary">Dark</span>
                          </button>
                          <button
                            onClick={() => setTheme('sepia')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === 'sepia'
                                ? 'border-accent bg-hover'
                                : 'border-border hover:border-secondary'
                            }`}
                          >
                            <Coffee className="w-6 h-6 mx-auto mb-2 text-secondary" />
                            <span className="text-sm text-secondary">Sepia</span>
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block font-medium text-primary mb-2">Font Family</label>
                        <select
                          value={localFontFamily}
                          onChange={(e) => {
                            setLocalFontFamily(e.target.value);
                            updateEditorSettings({ fontFamily: e.target.value });
                          }}
                          className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                        >
                          <option value="system-ui, -apple-system, sans-serif">System Default</option>
                          <option value="'SF Mono', Monaco, 'Cascadia Code', monospace">Monospace</option>
                          <option value="'Georgia', serif">Georgia</option>
                          <option value="'Times New Roman', serif">Times New Roman</option>
                          <option value="'Arial', sans-serif">Arial</option>
                          <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Inter', sans-serif">Inter</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block font-medium text-primary mb-2">
                          Font Size: {localFontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="24"
                          value={localFontSize}
                          onChange={(e) => {
                            const size = parseInt(e.target.value);
                            setLocalFontSize(size);
                            updateEditorSettings({ fontSize: size });
                          }}
                          className="w-full h-2 bg-hover rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted mt-1">
                          <span>12px</span>
                          <span>24px</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <button
                          onClick={() => {
                            const defaults = { fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 16 };
                            setLocalFontFamily(defaults.fontFamily);
                            setLocalFontSize(defaults.fontSize);
                            updateEditorSettings(defaults);
                          }}
                          className="px-4 py-2 bg-bg hover:bg-hover border border-border rounded-lg transition-colors text-secondary hover:text-primary"
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'keyboard' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">Keyboard Shortcuts</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Save paragraph</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + Enter</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Split paragraph</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">Shift + Enter</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Search</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + F</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Undo</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + Z</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Redo</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + Shift + Z</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Toggle focus mode</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + Shift + F</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Toggle left sidebar (Documents)</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + ←</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Toggle right sidebar (Tools)</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">⌘/Ctrl + →</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-secondary">Create new paragraph (while editing)</span>
                        <kbd className="px-2 py-1 bg-hover rounded text-xs font-mono">Double Enter</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">About Writer</h3>
                    <div className="space-y-4 text-secondary">
                      <p>
                        Writer is a structured writing tool inspired by Jordan Peterson's Essay.app methodology. 
                        It helps you organize your thoughts and create well-structured documents.
                      </p>
                      <div className="space-y-2">
                        <p className="font-medium text-primary">Version 1.0.0</p>
                        <p className="text-sm">Built with React, TypeScript, and Tailwind CSS</p>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm">
                          © 2024 Writer. Created with ❤️ for better writing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">Account</h3>
                    {userInfo && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg">
                          <img
                            src={userInfo.picture}
                            alt={userInfo.name}
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-primary">{userInfo.name}</p>
                            <p className="text-sm text-secondary">{userInfo.email}</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-border">
                          <button
                            onClick={() => {
                              logout();
                              onClose();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-bg hover:bg-hover border border-border rounded-lg transition-colors text-secondary hover:text-primary"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}