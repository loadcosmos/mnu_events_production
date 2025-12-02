import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import checkinService from '../services/checkinService';
import { toast } from 'sonner';
import { ArrowLeft, Camera, CheckCircle, XCircle, QrCode } from 'lucide-react';

export default function StudentScannerPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'STUDENT') {
      toast.error('Access Denied', {
        description: 'Only students can access this scanner',
      });
      navigate('/');
      return;
    }

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [user, isAuthenticated, navigate]);

  const handleScan = async (qrData) => {
    try {
      // QR data should be JSON string with event QR signature
      const data = JSON.parse(qrData);

      // Validate with backend
      const response = await checkinService.validateStudent(data);

      if (response.success) {
        // ✅ Successful check-in
        playSuccessSound();
        toast.success('✅ Check-in successful!', {
          description: `Checked into: ${response.event.title}`,
        });
        setLastScan({
          success: true,
          event: response.event,
          timestamp: new Date(),
          points: response.points || 0,
        });
      }
    } catch (error) {
      // ❌ Error
      playErrorSound();
      const errorMessage = error.response?.data?.message || error.message || 'Invalid QR code';
      toast.error('❌ ' + errorMessage);
      setLastScan({
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }
  };

  const startScanning = () => {
    if (scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
      },
      (error) => {
        // Ignore scan errors (they happen constantly while scanning)
        if (!error.includes('NotFoundException')) {
          console.warn('QR scan error:', error);
        }
      }
    );

    scannerRef.current = scanner;
    setScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan Event QR</h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-1">
                Scan event QR code to check in
              </p>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                How to check in:
              </h3>
              <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>Tap "Start Scanning" below</li>
                <li>Point your camera at the event QR code (displayed on screen/projector)</li>
                <li>Wait for the confirmation sound</li>
                <li>You're checked in! Earn points automatically 🎉</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        <Card className="liquid-glass-card rounded-2xl mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            {!scanning ? (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">
                  Ready to scan event QR code
                </p>
                <Button onClick={startScanning} size="lg" className="liquid-glass-red-button text-white rounded-2xl">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </Button>
              </div>
            ) : (
              <div>
                <div id="qr-reader" className="mb-6 rounded-lg overflow-hidden"></div>
                <div className="flex justify-center">
                  <Button onClick={stopScanning} variant="outline" className="rounded-xl">
                    Stop Scanning
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastScan && (
          <Card className={`liquid-glass-card rounded-2xl ${lastScan.success ? 'border-green-500' : 'border-red-500'} border-2`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {lastScan.success ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Check-in Successful!</h3>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {lastScan.event.title}
                      </p>
                      {lastScan.points > 0 && (
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mt-2">
                          🎉 You earned <span className="font-bold text-[#d62e1f]">+{lastScan.points} points</span>!
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatTime(lastScan.timestamp)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Scan Failed</h3>
                      <p className="text-gray-900 dark:text-white mt-1">{lastScan.error}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatTime(lastScan.timestamp)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dev Mode - Mock QR Input */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="liquid-glass-card rounded-2xl mt-6">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-sm">Dev Mode - Test QR Input</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Paste QR code JSON for testing"
                className="w-full h-32 p-3 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white font-mono text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    handleScan(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
