import { PlanningApp } from './app.js';

// Initialize the app and expose globally for inline handlers
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PlanningApp();
});

