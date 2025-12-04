import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../css/globals.css';
import { warnIfBackendUnavailable } from './utils/backendCheck.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Проверяем доступность бэкенда при загрузке (только в dev режиме)
if (import.meta.env.DEV) {
  warnIfBackendUnavailable().catch(console.error);
}



// Initialize Vercel Speed Insights
injectSpeedInsights();

// Монтируем приложение
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
