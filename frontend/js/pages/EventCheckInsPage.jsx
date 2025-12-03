import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import checkinService from '../services/checkinService';
import eventsService from '../services/eventsService';
import { ArrowLeft, Users, Clock, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../utils';

export default function EventCheckInsPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, checkInsData, statsData] = await Promise.all([
        eventsService.getEventById(eventId),
        checkinService.getCheckInList(eventId),
        checkinService.getEventStats(eventId)
      ]);

      setEvent(eventData);
      setCheckIns(checkInsData);
      setStats(statsData);
    } catch (err) {
      console.error('[EventCheckInsPage] Load failed:', err);
      toast.error('Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const [checkInsData, statsData] = await Promise.all([
        checkinService.getCheckInList(eventId),
        checkinService.getEventStats(eventId)
      ]);

      setCheckIns(checkInsData);
      setStats(statsData);
      toast.success('Check-ins refreshed');
    } catch (err) {
      console.error('[EventCheckInsPage] Refresh failed:', err);
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    if (!checkIns || checkIns.length === 0) {
      toast.error('No check-ins to export');
      return;
    }

    const headers = ['Name', 'Email', 'Faculty', 'Checked In At', 'Scan Mode'];
    const rows = checkIns.map(checkIn => [
      `${checkIn.user.firstName} ${checkIn.user.lastName}`,
      checkIn.user.email,
      checkIn.user.faculty || 'N/A',
      new Date(checkIn.checkedInAt).toLocaleString(),
      checkIn.scanMode === 'STUDENTS_SCAN' ? 'Student scanned' : 'Organizer scanned'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `checkins-${event?.title || 'event'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f] mb-4"></div>
          <p className="text-gray-600 dark:text-[#a0a0a0]">Loading check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/events/${eventId}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-[#d62e1f] dark:hover:text-[#d62e1f]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Event Check-Ins
              </h1>
              {event && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {event.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!checkIns || checkIns.length === 0}
              className="border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#d62e1f]/10 rounded-xl">
                  <Users className="h-6 w-6 text-[#d62e1f]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Check-Ins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCheckIns}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check-In Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.checkInRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.totalTickets ? 'Total Tickets' : 'Total Registered'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalTickets || stats.totalRegistrations || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Check-Ins Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Check-In List
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({checkIns.length} attendees)
              </span>
            </h2>
          </div>

          {checkIns.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No check-ins yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Attendees will appear here when they check in
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#2a2a2a]">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Faculty
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Checked In At
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Scan Mode
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {checkIns.map((checkIn) => (
                    <tr
                      key={checkIn.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]/50 transition-colors"
                    >
                      <td className="py-3 px-6 text-sm text-gray-900 dark:text-white font-medium">
                        {checkIn.user.firstName} {checkIn.user.lastName}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {checkIn.user.email}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {checkIn.user.faculty || 'N/A'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(checkIn.checkedInAt)}
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            checkIn.scanMode === 'STUDENTS_SCAN'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}
                        >
                          {checkIn.scanMode === 'STUDENTS_SCAN'
                            ? 'Student scanned'
                            : 'Organizer scanned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
