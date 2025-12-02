import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import eventsService from '../services/eventsService';
import { toast } from 'sonner';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Plus,
    ArrowLeft,
    Filter,
    DollarSign,
    BarChart3,
} from 'lucide-react';

export default function PartnerEventsPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');

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

        loadEvents();
    }, [isAuthenticated, user, navigate]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventsService.getMyEvents();
            setEvents(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.error('Failed to load events:', err);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            UPCOMING: { color: 'bg-green-500/10 border-green-500/20 text-green-400', label: 'Upcoming' },
            ONGOING: { color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', label: 'Ongoing' },
            COMPLETED: { color: 'bg-gray-500/10 border-gray-500/20 text-gray-400', label: 'Completed' },
            CANCELLED: { color: 'bg-red-500/10 border-red-500/20 text-red-400', label: 'Cancelled' },
            PENDING_MODERATION: { color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', label: 'Pending' },
        };

        const config = statusConfig[status] || statusConfig.UPCOMING;
        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const filteredEvents = filterStatus === 'ALL'
        ? events
        : events.filter(event => event.status === filterStatus);

    if (loading) {
        return (
            <div className="container max-w-7xl mx-auto py-8 px-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/5 rounded w-1/3"></div>
                    <div className="grid gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-white/5 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/partner')}
                            className="text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 mt-2">
                        <Calendar className="w-8 h-8 text-orange-400" />
                        My Events
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track all your events
                    </p>
                </div>
                <Button onClick={() => navigate('/partner/create-event')} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
                <CardContent className="py-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filter by status:</span>
                        <div className="flex gap-2">
                            {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'PENDING_MODERATION'].map((status) => (
                                <Button
                                    key={status}
                                    variant={filterStatus === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus(status)}
                                    className={filterStatus === status ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                >
                                    {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
                <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
                    <CardContent className="py-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No events found</h3>
                        <p className="text-muted-foreground mb-6">
                            {filterStatus === 'ALL'
                                ? "You haven't created any events yet"
                                : `No ${filterStatus.toLowerCase().replace('_', ' ')} events`}
                        </p>
                        <Button onClick={() => navigate('/partner/create-event')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Event
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                        <Card key={event.id} className="border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusBadge(event.status)}
                                            {event.isPaid && (
                                                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400">
                                                    Paid Event
                                                </Badge>
                                            )}
                                            {event.isExternalEvent && (
                                                <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400">
                                                    Partner Event
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {event.description || 'No description'}
                                        </CardDescription>
                                    </div>
                                    {event.isPaid && (
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {formatCurrency(event.price)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">per ticket</div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatDate(event.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>{event._count?.registrations || 0} / {event.capacity} attendees</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <span>Category: {event.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {event.status === 'UPCOMING' ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span>Location: {event.location}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/partner/events/${event.id}`)}
                                    >
                                        View Details
                                    </Button>
                                    {(event.status === 'UPCOMING' || event.status === 'PENDING_MODERATION') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/partner/events/${event.id}/edit`)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {event.isPaid && event.status !== 'PENDING_MODERATION' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate('/partner/payments')}
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Payments
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary */}
            {filteredEvents.length > 0 && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Showing {filteredEvents.length} event(s)</span>
                            <span>Total events: {events.length}</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
