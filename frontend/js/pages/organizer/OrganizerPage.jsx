import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button, buttonVariants } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import eventsService from '../../services/eventsService';
import apiClient from '../../services/apiClient';
import { toast } from 'sonner';

export default function OrganizerPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    totalRegistrations: 0,
  });
  const [allEvents, setAllEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'published', 'pending', 'rejected'

  useEffect(() => {
    if (isAuthenticated()) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем ВСЕ события организатора (включая PENDING_MODERATION)
      const response = await eventsService.getMyEvents({ page: 1, limit: 100 });
      const events = response.data || response || [];

      // Вычисляем статистику по статусам модерации
      // Event.status values: PENDING_MODERATION, UPCOMING, ONGOING, COMPLETED, CANCELLED
      const publishedEvents = events.filter(e =>
        e.status !== 'PENDING_MODERATION' && e.status !== 'CANCELLED'
      );
      const pendingEvents = events.filter(e => e.status === 'PENDING_MODERATION');
      const rejectedEvents = events.filter(e => e.status === 'CANCELLED');
      const totalRegistrations = events.reduce((sum, e) => sum + (e._count?.registrations || 0), 0);

      setStats({
        totalEvents: events.length,
        publishedEvents: publishedEvents.length,
        pendingEvents: pendingEvents.length,
        rejectedEvents: rejectedEvents.length,
        totalRegistrations,
      });

      // Сохраняем все события, отсортированные по дате
      setAllEvents(
        events.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      );
    } catch (err) {
      console.error('[OrganizerPage] Load dashboard data failed:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleExportParticipants = async (eventId, eventTitle) => {
    try {
      toast.info('Exporting participants...', {
        description: 'Downloading CSV file',
      });

      const response = await apiClient.get(`/registrations/event/${eventId}/export`, {
        responseType: 'blob',
      });

      // Create download link
      // apiClient interceptor returns response.data, which is the Blob itself when responseType is 'blob'
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export successful!', {
        description: 'Participants list downloaded',
      });
    } catch (err) {
      console.error('[OrganizerPage] Export failed:', err);
      toast.error('Export failed', {
        description: err.response?.data?.message || 'Failed to export participants list',
      });
    }
  };

  // Фильтрация событий по активной вкладке
  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'published':
        return allEvents.filter(e => e.status !== 'PENDING_MODERATION' && e.status !== 'CANCELLED');
      case 'pending':
        return allEvents.filter(e => e.status === 'PENDING_MODERATION');
      case 'rejected':
        return allEvents.filter(e => e.status === 'CANCELLED');
      default:
        return allEvents;
    }
  };

  // Получить бейдж статуса модерации
  const getModerationBadge = (status) => {
    switch (status) {
      case 'PENDING_MODERATION':
        return { variant: 'warning', label: 'Awaiting Approval', className: 'bg-orange-500 text-white' };
      case 'CANCELLED':
        return { variant: 'destructive', label: 'Cancelled', className: 'bg-red-600 text-white' };
      case 'UPCOMING':
      case 'ONGOING':
      case 'COMPLETED':
        return { variant: 'success', label: 'Published', className: 'bg-green-600 text-white' };
      default:
        return { variant: 'secondary', label: status, className: 'bg-gray-200 text-black dark:bg-gray-700 dark:text-white' };
    }
  };

  // Получить бейдж временного статуса
  const getTimeStatusBadge = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (startDate > now) return { variant: 'default', label: 'Upcoming', className: 'bg-blue-600 text-white' };
    if (startDate <= now && endDate >= now) return { variant: 'default', label: 'Ongoing', className: 'bg-red-600 text-white' };
    if (endDate < now) return { variant: 'secondary', label: 'Completed', className: 'bg-gray-500 text-white' };
    return { variant: 'secondary', label: 'Unknown', className: 'bg-gray-400 text-white' };
  };

  if (!isAuthenticated()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to access the organizer dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{user?.firstName || user?.email}</span>
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <Link to="/organizer/analytics">
            <i className="fa-solid fa-chart-line mr-2" />
            View Analytics
          </Link>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* KPI Cards - Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="liquid-glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Total Events</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="liquid-glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Published</CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-500">{stats.publishedEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="liquid-glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Pending Moderation</CardDescription>
            <CardTitle className="text-4xl font-bold text-orange-500">{stats.pendingEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="liquid-glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400">Total Registrations</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalRegistrations}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Events Table with Tabs */}
      <Card className="liquid-glass-card rounded-2xl">
        <CardHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">My Events</CardTitle>
              <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">Manage all your events</CardDescription>
            </div>
            <Button
              asChild
              className="liquid-glass-red-button text-white rounded-2xl"
            >
              <Link to="/organizer/create-event">
                Create Event
              </Link>
            </Button>
          </div>

          {/* Tabs for filtering */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className={cn(
                'rounded-xl transition-all',
                activeTab === 'all'
                  ? 'liquid-glass-red-button text-white'
                  : 'border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5'
              )}
            >
              All Events
              <Badge className="ml-2 bg-white/20 text-white">{stats.totalEvents}</Badge>
            </Button>
            <Button
              variant={activeTab === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('published')}
              className={cn(
                'rounded-xl transition-all',
                activeTab === 'published'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5'
              )}
            >
              Published
              <Badge className="ml-2 bg-white/20 text-white">{stats.publishedEvents}</Badge>
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className={cn(
                'rounded-xl transition-all',
                activeTab === 'pending'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5'
              )}
            >
              Pending
              <Badge className="ml-2 bg-white/20 text-white">{stats.pendingEvents}</Badge>
            </Button>
            {stats.rejectedEvents > 0 && (
              <Button
                variant={activeTab === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('rejected')}
                className={cn(
                  'rounded-xl transition-all',
                  activeTab === 'rejected'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                Rejected
                <Badge className="ml-2 bg-white/20 text-white">{stats.rejectedEvents}</Badge>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {getFilteredEvents().length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-2">
                {activeTab === 'pending' ? 'No pending events' : activeTab === 'published' ? 'No published events' : activeTab === 'rejected' ? 'No rejected events' : 'No events'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'all' ? 'Get started by creating your first event' : 'Try switching to another tab'}
              </p>
              {activeTab === 'all' && (
                <Button
                  asChild
                  size="lg"
                  className="liquid-glass-red-button text-white rounded-2xl"
                >
                  <Link to="/organizer/create-event">Create Your First Event</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {getFilteredEvents().map((event) => {
                  const registrations = event._count?.registrations || 0;
                  const capacity = event.capacity || 0;
                  const moderationBadge = getModerationBadge(event.status);
                  const timeStatusBadge = getTimeStatusBadge(event);
                  const percentage = capacity > 0 ? Math.min((registrations / capacity) * 100, 100) : 0;

                  return (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl bg-white dark:bg-[#1a1a1a] hover:border-[#d62e1f] transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                              {event.title}
                            </h3>
                            {/* Moderation Status Badge */}
                            <Badge className={moderationBadge.className}>
                              {moderationBadge.label}
                            </Badge>
                            {/* Time Status Badge */}
                            <Badge className={timeStatusBadge.className}>
                              {timeStatusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {formatDate(event.startDate)} · {event.location}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 font-medium">
                                {registrations} / {capacity} registered
                              </span>
                              <span className="text-gray-500">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                            {capacity > 0 && (
                              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-red-600 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-wrap">
                          <Link
                            to={`/events/${event.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl")}
                          >
                            View
                          </Link>

                          {/* Conditional QR button based on checkInMode */}
                          {event.checkInMode === 'STUDENTS_SCAN' ? (
                            <Link
                              to={`/organizer/event-qr/${event.id}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all")}
                              title="Display QR for students to scan (free internal events)"
                            >
                              <i className="fa-solid fa-desktop mr-1" />
                              QR Display
                            </Link>
                          ) : (
                            <Link
                              to={`/organizer/scanner/${event.id}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-[#d62e1f] text-[#d62e1f] hover:bg-[#d62e1f] hover:text-white rounded-xl transition-all")}
                              title="Scan student tickets/QR codes (paid/external events)"
                            >
                              <i className="fa-solid fa-qrcode mr-1" />
                              Scan QR
                            </Link>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportParticipants(event.id, event.title)}
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all"
                          >
                            <i className="fa-solid fa-download mr-1" />
                            Export
                          </Button>
                          <Link
                            to={`/organizer/events/${event.id}/edit`}
                            className={cn(buttonVariants({ size: "sm" }), "liquid-glass-red-button text-white rounded-xl")}
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                className="w-full mt-4 liquid-glass-red-button text-white rounded-2xl"
                size="lg"
                asChild
              >
                <Link to="/organizer/create-event">
                  Create New Event
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
