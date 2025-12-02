import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import checkinService from '../services/checkinService';
import eventsService from '../services/eventsService';
import { toast } from 'sonner';
import { ArrowLeft, Camera, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react';

export default function OrganizerScannerPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });
  const [lastScan, setLastScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    loadEventAndStats();
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [eventId]);

  const loadEventAndStats = async () => {
    try {
      setLoading(true);
      const [eventData, statsData] = await Promise.all([
        eventsService.getById(eventId),
        checkinService.getEventStats(eventId),
      ]);
      setEvent(eventData);
      setStats(statsData);
    } catch (err) {
      console.error('[OrganizerScannerPage] Load failed:', err);
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async () => {
    try {
      const statsData = await checkinService.getEventStats(eventId);
      setStats(statsData);
    } catch (err) {
      console.error('[OrganizerScannerPage] Update stats failed:', err);
    }
  };

  const handleScan = async (qrData) => {
    try {
      // QR data should be JSON string with signature
      const data = JSON.parse(qrData);

      // Validate ticket on backend
      const response = await checkinService.validateTicket(data);

      if (response.success) {
        // ✅ Successful check-in
        playSuccessSound();
        toast.success('✅ Check-in successful!', {
          description: `${response.user.firstName} ${response.user.lastName}`,
        });
        setLastScan({
          success: true,
          user: response.user,
          timestamp: new Date(),
        });
        await updateStats();
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
    // Create success beep sound
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
    // Create error beep sound
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f] mb-4"></div>
          <p className="text-gray-600 dark:text-[#a0a0a0]">Loading scanner...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">QR Scanner</h1>
              {event && <p className="text-gray-600 dark:text-[#a0a0a0] mt-1">{event.title}</p>}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="liquid-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCheckIns || 0}</h3>
                  <span className="text-sm text-gray-600 dark:text-[#a0a0a0]">Checked In</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="liquid-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalTickets || stats.totalRegistrations || 0}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-[#a0a0a0]">Total Participants</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="liquid-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.checkInRate || 0}%
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-[#a0a0a0]">Check-in Rate</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  Ready to scan student tickets
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
                      <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Check-in Successful</h3>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {lastScan.user.firstName} {lastScan.user.lastName}
                      </p>
                      {lastScan.user.faculty && (
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0]">{lastScan.user.faculty}</p>
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
