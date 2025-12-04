import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../css/globals.css';
import { warnIfBackendUnavailable } from './utils/backendCheck.js';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Проверяем доступность бэкенда при загрузке (только в dev режиме)
if (import.meta.env.DEV) {
  warnIfBackendUnavailable().catch(console.error);
}

// Монтируем приложение
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>
);
