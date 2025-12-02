import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import eventsService from '../services/eventsService';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CULTURAL', label: 'Cultural' },
    { value: 'TECH', label: 'Tech' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'CAREER', label: 'Career' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    loadEvents();
  }, [page, selectedCategory]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 20,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (search) {
        params.search = search;
      }

      const response = await eventsService.getAll(params);
      const eventsData = response.data || response || [];
      const meta = response.meta || {};

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error('[AdminEvents] Load events failed:', err);
      setError(err.message || 'Failed to load events');
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      await eventsService.delete(eventId);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (err) {
      console.error('[AdminEvents] Delete event failed:', err);
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      ACADEMIC: 'bg-blue-100 text-blue-800',
      SPORTS: 'bg-green-100 text-green-800',
      CULTURAL: 'bg-purple-100 text-purple-800',
      TECH: 'bg-indigo-100 text-indigo-800',
      SOCIAL: 'bg-pink-100 text-pink-800',
      CAREER: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.OTHER;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Manage Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Manage Events</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage all platform events</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 liquid-glass-card rounded-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-[#1a1a1a] dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="liquid-glass-red-button text-white rounded-2xl">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="liquid-glass-card rounded-2xl">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="liquid-glass-card rounded-2xl hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-2">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mb-3">
                      {event.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                      <Badge variant="outline">
                        {event._count?.registrations || 0} registrations
                      </Badge>
                      <Badge variant="outline">
                        Capacity: {event.capacity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Start: {formatDate(event.startDate)}</p>
                      <p>End: {formatDate(event.endDate)}</p>
                      {event.location && <p>Location: {event.location}</p>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-xl"
                  >
                    <Link to={`/events/${event.id}`}>View Details</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(event.id, event.title)}
                    className="rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

