import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import paymentVerificationService from '../services/paymentVerificationService';
import eventsService from '../services/eventsService';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

export default function PaymentVerificationPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [verifications, setVerifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [organizerNotes, setOrganizerNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Check if user has permission (ORGANIZER, MODERATOR, or ADMIN)
    const allowedRoles = ['ORGANIZER', 'MODERATOR', 'ADMIN', 'EXTERNAL_PARTNER'];
    if (!allowedRoles.includes(user?.role)) {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }

    loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load organizer's events
      const myEvents = await eventsService.getMyEvents();
      setEvents(Array.isArray(myEvents) ? myEvents : myEvents.data || []);

      // Load pending verifications
      await loadVerifications();
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const loadVerifications = async (eventId = null) => {
    try {
      const data = await paymentVerificationService.getPendingVerifications(
        eventId && eventId !== 'all' ? eventId : null
      );
      setVerifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load verifications:', err);
      toast.error('Failed to load verifications');
    }
  };

  const handleEventFilter = (eventId) => {
    setSelectedEvent(eventId);
    loadVerifications(eventId);
  };

  const handleApprove = async (verificationId) => {
    try {
      setProcessingId(verificationId);
      await paymentVerificationService.verifyPayment(verificationId, 'APPROVED');
      toast.success('Payment approved! QR code generated.');
      setSelectedVerification(null);
      await loadVerifications(selectedEvent !== 'all' ? selectedEvent : null);
    } catch (err) {
      toast.error(err.message || 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (verificationId) => {
    if (!organizerNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(verificationId);
      await paymentVerificationService.verifyPayment(verificationId, 'REJECTED', organizerNotes);
      toast.success('Payment rejected');
      setSelectedVerification(null);
      setOrganizerNotes('');
      await loadVerifications(selectedEvent !== 'all' ? selectedEvent : null);
    } catch (err) {
      toast.error(err.message || 'Failed to reject payment');
    } finally {
      setProcessingId(null);
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

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Verification</h1>
          <p className="text-muted-foreground mt-1">Review and approve student payments</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {verifications.length} Pending
        </Badge>
      </div>

      {/* Event Filter */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Filter by Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={handleEventFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Verifications List */}
      {verifications.length === 0 ? (
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-xl font-medium">All caught up!</p>
              <p className="text-muted-foreground">
                No pending payment verifications at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <Card
              key={verification.id}
              className="border-white/10 bg-white/5 backdrop-blur-lg hover:border-white/20 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-xl">{verification.ticket.event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Submitted {formatDate(verification.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/20">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <User className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {verification.ticket.user.firstName} {verification.ticket.user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {verification.ticket.user.email}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="font-bold text-blue-400">
                      {formatCurrency(verification.ticket.event.price)}
                    </div>
                  </div>
                </div>

                {/* Receipt Image */}
                {verification.receiptImageUrl && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Payment Receipt
                    </Label>
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5">
                      <img
                        src={verification.receiptImageUrl}
                        alt="Payment receipt"
                        className="w-full max-h-96 object-contain"
                        onClick={() =>
                          window.open(verification.receiptImageUrl, '_blank')
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          window.open(verification.receiptImageUrl, '_blank')
                        }
                      >
                        Open Full Size
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedVerification === verification.id ? (
                  <div className="space-y-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <Label htmlFor={`notes-${verification.id}`}>
                          Rejection Reason
                          <span className="text-red-400 ml-1">*</span>
                        </Label>
                        <Textarea
                          id={`notes-${verification.id}`}
                          placeholder="Please explain why this payment is being rejected..."
                          value={organizerNotes}
                          onChange={(e) => setOrganizerNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedVerification(null);
                          setOrganizerNotes('');
                        }}
                        disabled={processingId === verification.id}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(verification.id)}
                        disabled={processingId === verification.id || !organizerNotes.trim()}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {processingId === verification.id ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedVerification(verification.id)}
                      disabled={processingId !== null}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(verification.id)}
                      disabled={processingId !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processingId === verification.id ? 'Approving...' : 'Approve Payment'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
