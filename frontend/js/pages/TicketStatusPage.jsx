import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import paymentsService from '../services/paymentsService';
import paymentVerificationService from '../services/paymentVerificationService';
import { toast } from 'sonner';
import {
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  ArrowLeft,
  Info,
  AlertCircle,
  DollarSign,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Payment',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  PAID: {
    label: 'Paid',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
};

const VERIFICATION_STATUS_CONFIG = {
  PENDING: {
    label: 'Verification Pending',
    icon: Clock,
    color: 'text-yellow-400',
  },
  APPROVED: {
    label: 'Payment Verified',
    icon: CheckCircle,
    color: 'text-green-400',
  },
  REJECTED: {
    label: 'Payment Rejected',
    icon: XCircle,
    color: 'text-red-400',
  },
};

export default function TicketStatusPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/tickets/${ticketId}` } } });
      return;
    }

    loadTicketData();
  }, [ticketId, isAuthenticated, navigate]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load ticket details
      const ticketData = await paymentsService.getTicketById(ticketId);
      setTicket(ticketData);

      // Load verification status if ticket is for external event
      if (ticketData.event?.isExternalEvent) {
        try {
          const myVerifications = await paymentVerificationService.getMyVerifications();
          const ticketVerification = myVerifications.find(v => v.ticketId === ticketId);
          if (ticketVerification) {
            setVerification(ticketVerification);
          }
        } catch (verErr) {
          console.error('Failed to load verification:', verErr);
          // Don't show error to user - verification might not exist yet
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
      toast.error('Failed to load ticket details');
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription>{error || 'Ticket not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/my-tickets')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Ticket Status</h1>
      </div>

      {/* Ticket Status Card */}
      <Card className={`border-white/10 bg-white/5 backdrop-blur-lg ${statusConfig.borderColor}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
            <div>
              <CardTitle>{statusConfig.label}</CardTitle>
              <CardDescription>Ticket ID: {ticket.id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{ticket.event.title}</h3>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(ticket.event.startDate)}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{ticket.event.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="font-medium">{formatCurrency(ticket.price)}</span>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Purchased:</span>
              <span>{formatDate(ticket.purchasedAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="capitalize">{ticket.paymentMethod}</span>
            </div>
            {ticket.ticketCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ticket Code:</span>
                <span className="font-mono font-bold">{ticket.ticketCode}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status (for external events) */}
      {ticket.event?.isExternalEvent && verification && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Payment Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              {React.createElement(VERIFICATION_STATUS_CONFIG[verification.status].icon, {
                className: `w-5 h-5 ${VERIFICATION_STATUS_CONFIG[verification.status].color}`,
              })}
              <div>
                <div className="font-medium">
                  {VERIFICATION_STATUS_CONFIG[verification.status].label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {verification.status === 'PENDING' && 'Your payment receipt is being reviewed'}
                  {verification.status === 'APPROVED' && 'Your payment has been verified'}
                  {verification.status === 'REJECTED' && 'Payment verification was rejected'}
                </div>
              </div>
            </div>

            {verification.receiptImageUrl && (
              <div className="space-y-2">
                <Label>Receipt Screenshot</Label>
                <img
                  src={verification.receiptImageUrl}
                  alt="Payment receipt"
                  className="w-full max-h-96 object-contain rounded-lg border border-white/10"
                />
              </div>
            )}

            {verification.organizerNotes && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400">Organizer Notes:</p>
                  <p className="text-muted-foreground mt-1">{verification.organizerNotes}</p>
                </div>
              </div>
            )}

            {verification.status === 'PENDING' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Your payment receipt is under review. This usually takes up to 24 hours.</p>
                  <p className="mt-1">You will be notified once the payment is verified.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Code (if paid) */}
      {ticket.status === 'PAID' && ticket.qrCode && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <QrCode className="w-6 h-6" />
              Your Ticket QR Code
            </CardTitle>
            <CardDescription>Show this at the event entrance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <img src={ticket.qrCode} alt="Ticket QR Code" className="w-64 h-64" />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 w-full">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>Present this QR code at the event entrance for check-in.</p>
                <p className="mt-1">Make sure your screen brightness is high enough for scanning.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate(`/events/${ticket.event.id}`)} variant="outline" className="flex-1">
          View Event Details
        </Button>
        {ticket.status === 'PAID' && ticket.qrCode && (
          <Button onClick={() => window.print()} className="flex-1">
            <TicketIcon className="w-4 h-4 mr-2" />
            Print Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
