/**
 * Simple className utility function
 * Simplified version of clsx/twMerge functionality
 */

function cn(...inputs) {
  return inputs
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .join(' ');
}

// Make available globally
window.cn = cn;