import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import '../css/globals.css';
import { warnIfBackendUnavailable } from './utils/backendCheck.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Проверяем доступность бэкенда при загрузке (только в dev режиме)
if (import.meta.env.DEV) {
  warnIfBackendUnavailable().catch(console.error);
}

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache garbage collected after 10 minutes
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (optional)
    },
  },
});

// Initialize Vercel Speed Insights
injectSpeedInsights();

// Монтируем приложение
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
