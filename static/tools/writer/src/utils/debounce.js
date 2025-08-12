export function debounce(func, wait) {
  let timeout;
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  debounced.cancel = function() {
    clearTimeout(timeout);
  };
  debounced.flush = function() {
    clearTimeout(timeout);
    func.apply(this, arguments);
  };
  return debounced;
}