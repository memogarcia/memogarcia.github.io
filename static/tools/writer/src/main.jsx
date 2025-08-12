import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Theme initialization
const savedTheme = localStorage.getItem('pref-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
} else if (savedTheme === 'light') {
    document.body.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);