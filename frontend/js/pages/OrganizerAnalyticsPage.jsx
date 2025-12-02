import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import StatCard from '../components/StatCard';
import AnalyticsChart from '../components/AnalyticsChart';
import analyticsService from '../services/analyticsService';
import { Users, Calendar, CheckCircle, DollarSign, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizerAnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analyticsService.getOrganizerStats(user.id);
      setStats(data);
    } catch (err) {
      console.error('[OrganizerAnalyticsPage] Load failed:', err);
      setError(err.message || 'Failed to load analytics');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats || !stats.eventPerformance) return;

    const headers = ['Event Title', 'Registrations', 'Check-ins', 'Check-in Rate', 'Revenue'];
    const rows = stats.eventPerformance.map(event => [
      event.title,
      event.registrations,
      event.checkIns,
      `${event.checkInRate}%`,
      `${event.revenue}₸`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `organizer-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f] mb-4"></div>
          <p className="text-gray-600 dark:text-[#a0a0a0]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const eventPerformanceData = (stats.eventPerformance || []).slice(0, 10).map(event => ({
    name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
    registrations: event.registrations,
    checkIns: event.checkIns,
  }));

  const checkInRateData = (stats.eventPerformance || []).slice(0, 8).map(event => ({
    name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
    rate: event.checkInRate || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/organizer')}
              variant="ghost"
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] mt-1">Detailed event performance metrics</p>
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
          />
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={Users}
          />
          <StatCard
            title="Total Check-ins"
            value={stats.totalCheckIns}
            icon={CheckCircle}
          />
          <StatCard
            title="Avg Check-in Rate"
            value={`${Math.round(stats.checkInRate || 0)}%`}
            icon={CheckCircle}
            trend={stats.checkInRate >= 70 ? 'Good' : 'Needs improvement'}
            trendUp={stats.checkInRate >= 70}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AnalyticsChart
            type="bar"
            data={eventPerformanceData}
            title="Event Performance (Top 10)"
            xKey="name"
            yKey="registrations"
            height={300}
          />

          <AnalyticsChart
            type="line"
            data={checkInRateData}
            title="Check-in Rate by Event"
            xKey="name"
            yKey="rate"
            height={300}
          />
        </div>

        {/* Event Performance Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-[#2a2a2a]">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Event</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Registrations</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Check-ins</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Check-in Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.eventPerformance?.map((event, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{event.title}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">{event.registrations}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">{event.checkIns}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-semibold ${event.checkInRate >= 70
                          ? 'text-green-600 dark:text-green-400'
                          : event.checkInRate >= 50
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {event.checkInRate || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                      {event.revenue > 0 ? `${event.revenue}₸` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
