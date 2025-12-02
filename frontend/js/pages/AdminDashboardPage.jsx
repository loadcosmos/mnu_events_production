import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import eventsService from '../services/eventsService';
import usersService from '../services/usersService';
import clubsService from '../services/clubsService';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    activeClubs: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем статистику параллельно
      const [usersResponse, eventsResponse, clubsResponse] = await Promise.all([
        usersService.getAll({ page: 1, limit: 1 }), // Получаем только для подсчета total
        eventsService.getAll({ page: 1, limit: 1 }), // Получаем только для подсчета total
        clubsService.getAll({ page: 1, limit: 1 }), // Получаем только для подсчета total
      ]);

      // Извлекаем метаданные из ответов
      const totalUsers = usersResponse.meta?.total || usersResponse.total || 0;
      const totalEvents = eventsResponse.meta?.total || eventsResponse.total || 0;
      const activeClubs = clubsResponse.meta?.total || clubsResponse.total || 0;

      // Подсчитываем общее количество регистраций
      // Для этого нужно загрузить все события с регистрациями
      const allEventsResponse = await eventsService.getAll({ page: 1, limit: 1000 });
      const events = allEventsResponse.data || allEventsResponse || [];
      const totalRegistrations = events.reduce((sum, event) => {
        return sum + (event._count?.registrations || 0);
      }, 0);

      setStats({
        totalUsers,
        totalEvents,
        totalRegistrations,
        activeClubs,
      });
    } catch (err) {
      console.error('[AdminDashboard] Load statistics failed:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Loading statistics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse liquid-glass-card rounded-2xl">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Admin Dashboard</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 transition-colors duration-300">
            <p className="text-red-600 dark:text-red-400 transition-colors duration-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Platform statistics and overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Total Users</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              All registered users
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Total Events</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalEvents}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              All platform events
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Total Registrations</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.totalRegistrations}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              Event registrations
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Active Clubs</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.activeClubs}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              Student clubs
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="liquid-glass-card rounded-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Manage platform content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/events" className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#d62e1f] transition-all duration-300 cursor-pointer">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">Manage Events</h3>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">View and manage all platform events</p>
            </Link>
            <Link to="/admin/users" className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#d62e1f] transition-all duration-300 cursor-pointer">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">Manage Users</h3>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">View and manage user accounts</p>
            </Link>
            <Link to="/admin/clubs" className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#d62e1f] transition-all duration-300 cursor-pointer">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">Manage Clubs</h3>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">View and manage student clubs</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

