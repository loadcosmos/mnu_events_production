import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { moderationService } from '../services/moderationService';

export default function ModeratorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем статистику модерации
      const statsData = await moderationService.getStats();
      setStats(statsData);

      // Загружаем последние 5 элементов в очереди
      const queueData = await moderationService.getQueue('PENDING');
      setRecentItems(Array.isArray(queueData) ? queueData.slice(0, 5) : []);
    } catch (err) {
      console.error('[ModeratorDashboard] Load statistics failed:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getItemTitle = (item) => {
    if (!item.details) return 'Content not found';
    return item.details.title || item.details.name || 'Untitled';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Moderator Dashboard</h1>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Moderator Dashboard</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Moderation Dashboard</h1>
        <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Review and manage content submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Pending Review</CardDescription>
            <CardTitle className="text-4xl font-bold text-orange-600 dark:text-orange-400 transition-colors duration-300">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 transition-colors duration-300">
              Requires attention
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Approved</CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">{stats.approved}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 transition-colors duration-300">
              Content published
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Rejected</CardDescription>
            <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400 transition-colors duration-300">{stats.rejected}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 transition-colors duration-300">
              Content declined
            </Badge>
          </CardContent>
        </Card>

        <Card className="liquid-glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Total Reviewed</CardDescription>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-xs border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              All time
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="liquid-glass-card rounded-2xl transition-all duration-300 mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Manage moderation queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/moderator/queue" className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#d62e1f] transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">Pending Queue</h3>
                <Badge className="bg-orange-600 text-white">{stats.pending}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Review pending submissions</p>
            </Link>
            <Link to="/moderator/queue?status=APPROVED" className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#d62e1f] transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">Approved Content</h3>
                <Badge className="bg-green-600 text-white">{stats.approved}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">View approved submissions</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Pending Items */}
      {recentItems.length > 0 && (
        <Card className="liquid-glass-card rounded-2xl transition-all duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Recent Pending Items</CardTitle>
                <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">Latest submissions awaiting review</CardDescription>
              </div>
              <Button
                asChild
                className="liquid-glass-red-button text-white rounded-2xl"
              >
                <Link to="/moderator/queue">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl bg-white dark:bg-[#1a1a1a] hover:border-[#d62e1f] transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.itemType === 'SERVICE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.itemType === 'EVENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                          {item.itemType}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                          {getItemTitle(item)}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitted: {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="liquid-glass-red-button text-white rounded-xl ml-4"
                    >
                      <Link to="/moderator/queue">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentItems.length === 0 && (
        <Card className="liquid-glass-card rounded-2xl transition-all duration-300">
          <CardContent className="py-12">
            <div className="text-center">
              <i className="fa-solid fa-check-circle text-4xl text-green-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">All Caught Up!</h3>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">No pending items to review at the moment.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
