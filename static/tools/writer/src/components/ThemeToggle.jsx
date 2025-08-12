import React, { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      return stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-hover rounded-lg transition-colors text-secondary hover:text-primary"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? '🌞' : '🌙'}
    </button>
  );
}