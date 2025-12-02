import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import checkinService from '../services/checkinService';
import { toast } from 'sonner';

export default function QRScannerModal({ eventId, onSuccess, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    // Dynamic import of html5-qrcode
    const initScanner = async () => {
      try {
        // Try to load html5-qrcode library
        let Html5Qrcode;
        try {
          const module = await import('html5-qrcode');
          Html5Qrcode = module.Html5Qrcode || module.default?.Html5Qrcode;
        } catch (importError) {
          console.error('html5-qrcode not installed. Please run: npm install html5-qrcode');
          setError('QR scanner library not installed. Please install html5-qrcode package.');
          toast.error('QR scanner not available. Please install html5-qrcode package.');
          return;
        }
        
        if (!Html5Qrcode) {
          setError('QR scanner library not available');
          return;
        }
        
        if (!qrReaderRef.current) return;

        const elementId = qrReaderRef.current.id || 'qr-reader';
        if (!qrReaderRef.current.id) {
          qrReaderRef.current.id = elementId;
        }

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            try {
              // Validate student check-in
              const response = await checkinService.validateStudent(decodedText);
              
              if (response.success) {
                toast.success('Check-in successful!', {
                  description: 'You have been checked in to this event.',
                });
                
                if (onSuccess) {
                  onSuccess(response);
                }
                
                stopScanner();
                onClose();
              }
            } catch (err) {
              const errorMessage = err.response?.data?.message || err.message || 'Check-in failed';
              setError(errorMessage);
              toast.error(errorMessage);
              
              // Clear error after 3 seconds
              setTimeout(() => setError(null), 3000);
            }
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
            console.debug('QR scan error:', errorMessage);
          }
        );
      } catch (err) {
        console.error('Failed to initialize QR scanner:', err);
        setError('Failed to initialize camera. Please check permissions.');
        toast.error('Camera access denied or not available');
      }
    };

    initScanner();

    return () => {
      stopScanner();
    };
  }, [scanning, eventId, onSuccess, onClose]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const startScanning = () => {
    setScanning(true);
    setError(null);
  };

  const handleClose = async () => {
    await stopScanner();
    setScanning(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-[#d62e1f]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scan QR Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="liquid-glass-button text-gray-700 dark:text-gray-300 p-2 rounded-full hover:scale-110 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {!scanning ? (
            <div className="text-center space-y-4">
              <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-[#0a0a0a] rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-[#2a2a2a]">
                <Camera className="w-16 h-16 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Click the button below to start scanning
              </p>
              <button
                onClick={startScanning}
                className="w-full px-6 py-4 liquid-glass-red-button text-white rounded-xl font-bold text-lg hover:scale-105 transition-all"
              >
                <Camera className="w-5 h-5 inline mr-2" />
                Start Camera
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="qr-reader"
                ref={qrReaderRef}
                className="w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] min-h-[300px]"
              />
              
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-all"
              >
                Stop Scanning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

