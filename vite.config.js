import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Backend URL for proxy (dev mode only)
  // Priority: VITE_BACKEND_URL env var -> localhost:3001
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3001';

  console.log(`[Vite Config] Backend proxy target: ${backendUrl}`);

  return {
    root: './frontend', // Указываем, что frontend - это корень проекта для Vite
    publicDir: 'public', // Папка public относительно root (frontend/public)
    plugins: [react(), basicSsl()],
    server: {
      port: 5173, // Стандартный порт Vite
      open: true,
      host: '0.0.0.0', // Разрешить доступ с других устройств в сети
      https: true, // Enable HTTPS for camera access (required for mobile camera API)
      hmr: {
        overlay: true, // Показывать overlay с ошибками
        clientPort: 5173, // Port that client should connect to
        protocol: 'wss',  // Use secure WebSocket for HMR over HTTPS
      },
      // Proxy API requests to backend (solves Mixed Content issue in dev)
      // In production, frontend makes direct requests to VITE_API_URL
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false, // Allow self-signed certs in dev
          ws: true, // Proxy WebSocket connections
        },
      },
    },
    build: {
      outDir: '../dist', // Собираем в dist в корне проекта
      sourcemap: false, // Отключаем sourcemaps в production для уменьшения размера
      target: 'esnext', // Использовать современный ES
      chunkSizeWarningLimit: 500, // Лимит предупреждения о размере чанка (уменьшен с 1000)
      rollupOptions: {
        output: {
          // Улучшенный code splitting для оптимальной загрузки
          manualChunks: {
            // React core - базовые библиотеки React
            'react-core': ['react', 'react-dom'],

            // Router - отдельный chunk для роутинга
            'react-router': ['react-router-dom'],

            // UI библиотеки - компоненты UI
            'ui-libs': ['@radix-ui/react-select', 'lucide-react', 'sonner'],

            // Charts - библиотека для графиков (используется только в analytics)
            'charts': ['recharts'],

            // QR code - библиотеки для QR кодов (используется только в scanner)
            'qr-code': ['html5-qrcode', 'qrcode'],

            // Utils - утилиты и вспомогательные библиотеки
            'utils': ['axios', 'dompurify', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          },
        },
      },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './frontend/js'),
        '@components': path.resolve(__dirname, './frontend/js/components'),
        '@services': path.resolve(__dirname, './frontend/js/services'),
        '@context': path.resolve(__dirname, './frontend/js/context'),
        '@pages': path.resolve(__dirname, './frontend/js/pages'),
        '@utils': path.resolve(__dirname, './frontend/js/utils'),
        '@css': path.resolve(__dirname, './frontend/css'),
      },
    },
  };
});
