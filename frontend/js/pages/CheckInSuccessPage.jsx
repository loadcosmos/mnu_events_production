import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Button } from '../components/ui/button';

export default function CheckInSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // Get data from URL params
  const pointsEarned = parseInt(searchParams.get('points') || '0');
  const totalPoints = parseInt(searchParams.get('total') || pointsEarned.toString());
  const level = searchParams.get('level') || 'NEWCOMER';
  const eventTitle = searchParams.get('event') || 'Event';

  // Level display mapping
  const levelConfig = {
    NEWCOMER: { label: 'Newcomer', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    ACTIVE: { label: 'Active', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    LEADER: { label: 'Leader', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    LEGEND: { label: 'Legend', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  };

  const currentLevel = levelConfig[level] || levelConfig.NEWCOMER;

  // Confetti animation on mount
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#d62e1f', '#ff4433', '#EF4444', '#b52618', '#FFD700'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst at start
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d62e1f', '#ff4433', '#EF4444'],
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      navigate('/registrations');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
          {/* Checkmark Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
                <i className="fa-solid fa-check text-5xl text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-3 transition-colors duration-300">
            Check-In Successful! 🎉
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 transition-colors duration-300">
            You've successfully checked in to <span className="font-semibold text-gray-900 dark:text-white">{decodeURIComponent(eventTitle)}</span>
          </p>

          {/* Points Earned Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Points Earned</p>
                <p className="text-white text-4xl font-bold">+{pointsEarned} XP</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <i className="fa-solid fa-trophy text-white text-2xl" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Total Points */}
            <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-xl p-4 border border-gray-200 dark:border-[#3a3a3a] transition-colors duration-300">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Points</p>
              <p className="text-gray-900 dark:text-white text-2xl font-bold">{totalPoints} XP</p>
            </div>

            {/* Current Level */}
            <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-xl p-4 border border-gray-200 dark:border-[#3a3a3a] transition-colors duration-300">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Current Level</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${currentLevel.bgColor} dark:bg-opacity-20`}>
                <i className="fa-solid fa-medal text-sm" />
                <span className={`text-sm font-bold ${currentLevel.color}`}>
                  {currentLevel.label}
                </span>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 mb-6 transition-colors duration-300">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              <i className="fa-solid fa-clock mr-2" />
              Redirecting to your registrations in <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold"
              onClick={() => navigate('/registrations')}
            >
              <i className="fa-solid fa-calendar-check mr-2" />
              View My Registrations
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-gray-300 dark:border-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl font-semibold"
              onClick={() => navigate('/events')}
            >
              <i className="fa-solid fa-compass mr-2" />
              Explore Events
            </Button>
          </div>

          {/* Additional Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a] flex justify-center gap-6 text-sm">
            <Link
              to="/csi-dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <i className="fa-solid fa-chart-line mr-1" />
              View CSI Stats
            </Link>
            <Link
              to="/profile"
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <i className="fa-solid fa-user mr-1" />
              Profile
            </Link>
          </div>
        </div>

        {/* Fun Fact or Tip */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            💡 Tip: Attend more events to level up and earn achievements!
          </p>
        </div>
      </div>
    </div>
  );
}
