import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import partnersService from '../services/partnersService';
import eventsService from '../services/eventsService';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Plus,
  AlertCircle,
  Percent,
  BarChart3,
} from 'lucide-react';

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreateEvent, setCanCreateEvent] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'EXTERNAL_PARTNER') {
      toast.error('This page is only accessible to external partners');
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [profileData, statsData, eventsData, limitCheck] = await Promise.all([
        partnersService.getMyProfile(),
        partnersService.getMyStats(),
        eventsService.getMyEvents(),
        partnersService.canCreateEvent(),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
      setCanCreateEvent(limitCheck);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBuySlots = () => {
    toast.info('To purchase additional event slots, please contact support via WhatsApp: +7 777 999 88 77');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 bg-white/5 rounded"></div>
            <div className="h-32 bg-white/5 rounded"></div>
            <div className="h-32 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription>Failed to load partner profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            Partner Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">{profile.companyName}</p>
        </div>
        {canCreateEvent?.allowed ? (
          <Button onClick={() => navigate('/partner/create-event')} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        ) : (
          <Button onClick={handleBuySlots} variant="outline" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Buy Event Slots
          </Button>
        )}
      </div>

      {/* Event Limits Alert */}
      {canCreateEvent && !canCreateEvent.allowed && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-400">Event Limit Reached</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You have {canCreateEvent.currentEvents} active events out of {canCreateEvent.limit} allowed.
                  Purchase additional slots to create more events (3,000₸ per slot).
                </p>
              </div>
              <Button onClick={handleBuySlots} variant="outline" size="sm">
                Buy Slots
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(stats.totalRevenue || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  After commission
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Commission */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Platform Commission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Percent className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(stats.totalCommission || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(profile.commissionRate * 100).toFixed(0)}% rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Sold */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Tickets Sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold">{stats.totalTicketsSold || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.pendingVerification || 0} pending
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Events */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Active Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-2xl font-bold">{stats.activeEvents || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {canCreateEvent?.limit || 0} total slots
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Contact Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Info */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company Name:</span>
              <span className="font-medium">{profile.companyName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">БИН:</span>
              <span className="font-mono">{profile.bin}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact Person:</span>
              <span>{profile.contactPerson}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              {profile.isVerified ? (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/20">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kaspi Phone:</span>
              <span className="font-mono">{profile.kaspiPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kaspi Name:</span>
              <span>{profile.kaspiName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commission Rate:</span>
              <span className="font-bold text-blue-400">
                {(profile.commissionRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Event Slots:</span>
              <span>
                1 free + {profile.paidEventSlots} paid
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Details */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Phone className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{profile.phone}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{profile.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm text-muted-foreground">WhatsApp</div>
              <div className="font-medium">{profile.whatsapp}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Events */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              My Events
            </CardTitle>
            <Button
              onClick={() => navigate('/partner/payments')}
              variant="outline"
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Verify Payments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No events created yet</p>
              <Button onClick={() => navigate('/partner/create-event')} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  to={`/partner/events/${event.id}`}
                  className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(event.startDate)} • {event.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          event.status === 'UPCOMING'
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-gray-500/10 border-gray-500/20'
                        }
                      >
                        {event.status}
                      </Badge>
                      {event.isPaid && (
                        <div className="text-sm font-bold text-blue-400 mt-1">
                          {formatCurrency(event.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {events.length > 5 && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/partner/events')}>
                  View All Events ({events.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
