import { Moon, Sun, Coffee } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-hover rounded-lg transition-colors"
      aria-label={`Current theme: ${theme}. Click to switch.`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.8, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotate: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-secondary" />
        ) : theme === 'dark' ? (
          <Moon className="w-5 h-5 text-secondary" />
        ) : (
          <Coffee className="w-5 h-5 text-secondary" />
        )}
      </motion.div>
    </button>
  );
}