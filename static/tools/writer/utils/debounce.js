/**
 * Creates a debounced version of a function that delays invoking func until after
 * wait milliseconds have elapsed since the last time the debounced function was invoked
 * Converted from TypeScript to JavaScript
 */
function debounce(func, wait) {
  let timeoutId = null;
  let lastArgs = null;

  const debounced = function(...args) {
    lastArgs = args;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  };

  // Add flush method to immediately invoke pending execution
  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs !== null) {
        func(...lastArgs);
        lastArgs = null;
      }
    }
  };

  // Add cancel method to cancel pending execution
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled version of a function that only invokes func at most once
 * per every wait milliseconds
 */
function throttle(func, wait) {
  let inThrottle = false;
  let lastArgs = null;

  return function throttled(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          throttled(...lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

// Make available globally
window.debounce = debounce;
window.throttle = throttle;