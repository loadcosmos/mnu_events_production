import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

/**
 * QR Code Scanner Component
 * Uses html5-qrcode library for camera access and QR detection
 *
 * @param {Function} onScanSuccess - Callback when QR code is scanned successfully
 * @param {Function} onClose - Callback to close the scanner
 */
export default function QRScanner({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('requesting');

  useEffect(() => {
    let scanner = null;

    const initScanner = async () => {
      try {
        console.log('Initializing QR Scanner...');
        console.log('window.isSecureContext:', window.isSecureContext);
        console.log('navigator.mediaDevices:', navigator.mediaDevices);
        console.log('Location:', window.location.href);
        
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('MediaDevices API not available');
          throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
        }

        setCameraPermission('granted');

        // Initialize html5-qrcode scanner directly
        // Let it handle camera permission internally
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true,
            // Force camera constraints
            videoConstraints: {
              facingMode: 'environment' // prefer back camera on mobile
            }
          },
          /* verbose= */ true // Enable verbose logging for debugging
        );

        html5QrCodeScannerRef.current = scanner;

        const onScanSuccessHandler = (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          if (html5QrCodeScannerRef.current) {
            html5QrCodeScannerRef.current.clear().catch(console.error);
          }
          setIsScanning(false);
          onScanSuccess(decodedText, decodedResult);
        };

        const onScanErrorHandler = (errorMessage) => {
          // Ignore frequent scanning errors (camera still searching)
          if (errorMessage.includes('No MultiFormat Readers')) return;
          if (errorMessage.includes('QR code parse error')) return;
          console.debug('QR Scan error:', errorMessage);
        };

        console.log('Rendering scanner...');
        scanner.render(onScanSuccessHandler, onScanErrorHandler);
        setIsScanning(true);
        setError(null);
        console.log('Scanner initialized successfully');
      } catch (err) {
        console.error('Camera initialization failed:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        setCameraPermission('denied');
        
        let errorMessage = 'Не удалось получить доступ к камере.';
        let debugInfo = '';
        
        if (err.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
          errorMessage = 'API камеры недоступен.';
          debugInfo = `

Детали:
- Браузер: ${navigator.userAgent}
- Secure Context: ${window.isSecureContext}
- URL: ${window.location.href}

Для работы камеры необходим безопасный контекст (HTTPS или localhost).`;
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Камера не найдена. Проверьте подключение камеры.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Камера используется другим приложением. Закройте другие приложения, использующие камеру.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Ошибка безопасности: камера недоступна в небезопасном контексте.';
          debugInfo = `\n\nДля доступа к камере сайт должен работать через HTTPS или localhost.\nТекущий URL: ${window.location.href}`;
        }
        
        setError(errorMessage + debugInfo);
      }
    };

    initScanner();

    return () => {
      if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear().catch((err) => {
          console.error('Failed to clear scanner:', err);
        });
        html5QrCodeScannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Сканировать QR-код
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Наведите камеру на QR-код организатора
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-black/30 rounded-xl transition-all duration-200"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6 bg-gray-50 dark:bg-[#0a0a0a]">
          {/* Loading State */}
          {cameraPermission === 'requesting' && !error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Инициализация камеры...</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center max-w-md">
                Для работы камеры браузер требует безопасное соединение<br/>
                (HTTPS или localhost)
              </p>
            </div>
          )}

          {/* Camera View */}
          <div
            id="qr-reader"
            ref={scannerRef}
            className="rounded-xl overflow-hidden shadow-xl border-4 border-gray-200 dark:border-[#2a2a2a] bg-black min-h-[300px]"
            style={{ display: cameraPermission === 'granted' ? 'block' : 'none' }}
          />

          {/* Error State */}
          {error && (
            <div className="mt-4 p-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-exclamation text-white text-lg"></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">
                    Ошибка доступа к камере
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!error && (
            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50">
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <i className="fa-solid fa-info-circle text-blue-600 dark:text-blue-400 mr-2"></i>
                Инструкция:
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">1.</span>
                  <span>Разрешите доступ к камере в браузере</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">2.</span>
                  <span>Наведите камеру на QR-код организатора</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">3.</span>
                  <span>Дождитесь автоматического распознавания</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">4.</span>
                  <span>Check-in будет выполнен автоматически</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <i className="fa-solid fa-xmark mr-2"></i>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
