import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import { getCsiIcon, getCsiColors, getCsiLabel } from '../utils/categoryMappers';
import { CSI_CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/dateFormatters';
import { toast } from 'sonner';

export default function CsiDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [csiStats, setCsiStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'STUDENT') {
      toast.error('Access Denied', {
        description: 'Only students can access CSI Dashboard',
      });
      navigate('/');
      return;
    }

    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await analyticsService.getStudentCsiStats(user.id);

        if (isCancelled) return;

        setCsiStats(data);
      } catch (err) {
        console.error('[CsiDashboardPage] Failed to load CSI stats:', err);

        if (isCancelled) return;

        const errorMessage =
          err.response?.data?.message
            ? Array.isArray(err.response.data.message)
              ? err.response.data.message.join(', ')
              : err.response.data.message
            : err.message || 'Failed to load CSI statistics';
        setError(errorMessage);
        toast.error('Failed to load CSI statistics', {
          description: errorMessage,
        });
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [user, isAuthenticated, navigate]);

  const loadCsiStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analyticsService.getStudentCsiStats(user.id);
      setCsiStats(data);
    } catch (err) {
      console.error('[CsiDashboardPage] Failed to load CSI stats:', err);
      const errorMessage =
        err.response?.data?.message
          ? Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message
          : err.message || 'Failed to load CSI statistics';
      setError(errorMessage);
      toast.error('Failed to load CSI statistics', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="text-center text-gray-900 dark:text-white transition-colors duration-300">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f] mb-4"></div>
          <p className="text-xl">Loading CSI statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !csiStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center max-w-md">
          <i className="fa-solid fa-exclamation-circle text-5xl text-[#d62e1f] mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            Failed to load CSI statistics
          </h2>
          <p className="text-gray-600 dark:text-[#a0a0a0] mb-6 transition-colors duration-300">{error}</p>
          <button
            onClick={loadCsiStats}
            className="liquid-glass-red-button text-white px-6 py-3 rounded-2xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const csiCategories = [
    { key: 'creativity', value: CSI_CATEGORIES.CREATIVITY },
    { key: 'service', value: CSI_CATEGORIES.SERVICE },
    { key: 'intelligence', value: CSI_CATEGORIES.INTELLIGENCE },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section */}
      <div className="py-12 px-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            CSI <span className="text-[#d62e1f]">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            Creativity, Service, Intelligence - Track your participation
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] shadow-lg transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d62e1f] to-[#b91c1c] rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-calendar-check text-white text-2xl" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-[#a0a0a0] text-sm transition-colors duration-300">
                    Total Events Attended
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white transition-colors duration-300">
                    {csiStats.totalEvents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] shadow-lg transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-star text-white text-2xl" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-[#a0a0a0] text-sm transition-colors duration-300">
                    CSI-Tagged Events
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white transition-colors duration-300">
                    {csiStats.totalCsiEvents}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CSI Category Breakdown */}
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            CSI <span className="text-[#d62e1f]">Breakdown</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {csiCategories.map(({ key, value }) => {
              const colors = getCsiColors(value);
              const icon = getCsiIcon(value);
              const label = getCsiLabel(value);
              const stats = csiStats.csiBreakdown[key];

              return (
                <div
                  key={value}
                  className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{icon}</span>
                        <h3 className="text-2xl font-bold">{label}</h3>
                      </div>
                      <span className="text-5xl font-extrabold opacity-90">{stats.events}</span>
                    </div>
                    <p className="text-white/80 text-sm">Events attended</p>
                  </div>

                  {/* Recent Events */}
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-[#a0a0a0] mb-4 transition-colors duration-300">
                      Recent Events ({stats.recentEvents.length})
                    </h4>

                    {stats.recentEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fa-regular fa-calendar-xmark text-3xl text-gray-300 dark:text-[#666666] mb-2 transition-colors duration-300" />
                        <p className="text-sm text-gray-500 dark:text-[#666666] transition-colors duration-300">
                          No events yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer"
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1 transition-colors duration-300">
                              {event.title}
                            </h5>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                                {formatDate(event.date)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] transition-colors duration-300">
                                {event.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-6 transition-colors duration-300">
            <div className="flex items-start gap-4">
              <i className="fa-solid fa-circle-info text-2xl text-blue-600 dark:text-blue-400 transition-colors duration-300" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  About CSI Tracking
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                  CSI (Creativity, Service, Intelligence) tracks your participation across different types of events:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">🎨</span>
                    <span><strong>Creativity:</strong> Arts, cultural events, creative workshops</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">🤝</span>
                    <span><strong>Service:</strong> Community service, volunteering, social initiatives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🧠</span>
                    <span><strong>Intelligence:</strong> Academic events, tech workshops, research presentations</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4 transition-colors duration-300">
                  * Events are counted when you check in at the event. One event can contribute to multiple CSI categories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
