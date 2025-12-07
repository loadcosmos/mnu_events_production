import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import eventsService from '../../services/eventsService';
import paymentsService from '../../services/paymentsService';
import paymentVerificationService from '../../services/paymentVerificationService';
import { toast } from 'sonner';
import {
  CreditCard,
  Copy,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowLeft,
  Info,
  Phone,
  User,
  Building2,
} from 'lucide-react';

export default function TicketPurchasePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState('details'); // details, payment, receipt, confirmation

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/events/${eventId}/purchase` } } });
      return;
    }

    loadEvent();
  }, [eventId, isAuthenticated, navigate]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventsService.getById(eventId);
      setEvent(data);

      // Check if event is paid and has external partner
      if (!data.isPaid) {
        toast.error('This event is free. No payment required.');
        navigate(`/events/${eventId}`);
        return;
      }

      if (!data.isExternalEvent) {
        toast.error('This event uses standard payment. Redirecting...');
        // For non-external events, use the standard payment flow
        navigate(`/events/${eventId}`);
        return;
      }
    } catch (err) {
      setError(err.message || 'Failed to load event');
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      setLoading(true);
      // Create ticket with PENDING status
      const ticketData = await paymentsService.createPayment(eventId, event.price);
      setTicket(ticketData);
      setStep('payment');
      toast.success('Ticket created! Please proceed with payment.');
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleUploadReceipt = async () => {
    if (!receiptUrl.trim()) {
      toast.error('Please enter receipt image URL');
      return;
    }

    try {
      setUploading(true);
      await paymentVerificationService.uploadReceipt(ticket.id, receiptUrl);
      setStep('confirmation');
      toast.success('Receipt uploaded successfully! Waiting for verification.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
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

  if (loading && !event) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Purchase Ticket</h1>
      </div>

      {/* Event Summary */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {new Date(event.startDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span className="text-2xl font-bold text-blue-400">{formatCurrency(event.price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span>{event.location}</span>
          </div>
          {event.externalPartner && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
              <Building2 className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium">Hosted by</div>
                <div className="text-sm text-muted-foreground">{event.externalPartner.companyName}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Event Details & Create Ticket */}
      {step === 'details' && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Ready to Purchase?</CardTitle>
            <CardDescription>
              Click below to generate your ticket and proceed with payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-blue-400">Payment Instructions</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Payment is processed via Kaspi transfer</li>
                  <li>You will receive payment details after creating the ticket</li>
                  <li>Upload a screenshot of your payment for verification</li>
                  <li>Organizer will verify and approve within 24 hours</li>
                  <li>Your QR code ticket will be generated upon approval</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleCreateTicket}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Create Ticket & Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Payment Instructions with Kaspi Details */}
      {step === 'payment' && ticket && event.externalPartner && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-400" />
              Payment via Kaspi Transfer
            </CardTitle>
            <CardDescription>
              Transfer {formatCurrency(event.price)} to the details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kaspi Phone */}
            <div className="space-y-2">
              <Label>Kaspi Phone Number</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={event.externalPartner.kaspiPhone}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(event.externalPartner.kaspiPhone, 'Phone number')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Kaspi Name */}
            <div className="space-y-2">
              <Label>Recipient Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={event.externalPartner.kaspiName}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(event.externalPartner.kaspiName, 'Recipient name')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount to Transfer</Label>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400 text-center">
                  {formatCurrency(event.price)}
                </div>
              </div>
            </div>

            {/* Ticket Code for Comment */}
            <div className="space-y-2">
              <Label>
                Comment/Reference
                <span className="text-red-400 ml-1">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={ticket.ticketCode || ticket.id}
                  readOnly
                  className="font-mono font-bold text-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(ticket.ticketCode || ticket.id, 'Ticket code')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Important: Include this code in the transfer comment/note!
              </p>
            </div>

            {/* Contact Support via WhatsApp */}
            {event.externalPartner?.whatsappNumber && (
              <div className="space-y-2">
                <Label>Need Help?</Label>
                <a
                  href={`https://wa.me/${event.externalPartner.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello!%20I%20need%20help%20with%20ticket%20${encodeURIComponent(ticket.ticketCode || ticket.id)}%20for%20${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full p-4 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-green-400">Contact Organizer via WhatsApp</div>
                    <div className="text-sm text-muted-foreground">{event.externalPartner.whatsappNumber}</div>
                  </div>
                  <i className="fab fa-whatsapp text-2xl text-green-400" />
                </a>
              </div>
            )}

            {/* Instructions */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-amber-400">Important Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open Kaspi app on your phone</li>
                  <li>Go to Transfers → By phone number</li>
                  <li>Enter the phone number: {event.externalPartner.kaspiPhone}</li>
                  <li>Enter amount: {formatCurrency(event.price)}</li>
                  <li>
                    <strong>Add comment:</strong> {ticket.ticketCode || ticket.id}
                  </li>
                  <li>Complete the transfer</li>
                  <li>Take a screenshot of the successful transfer</li>
                  <li>Return here and upload the screenshot below</li>
                </ol>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receiptUrl">
                Receipt Screenshot URL
                <span className="text-red-400 ml-1">*</span>
              </Label>
              <Input
                id="receiptUrl"
                type="url"
                placeholder="https://example.com/receipt-image.jpg"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Upload your screenshot to an image hosting service (e.g., Imgur, ImgBB) and paste the URL here
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('details');
                  setTicket(null);
                }}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUploadReceipt}
                disabled={uploading || !receiptUrl.trim()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Submit Receipt'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirmation' && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              Receipt Submitted Successfully!
            </CardTitle>
            <CardDescription>Your payment is pending verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-400">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>The event organizer will review your payment receipt</li>
                  <li>Verification usually takes up to 24 hours</li>
                  <li>You will receive a notification when approved</li>
                  <li>Your QR code ticket will be generated automatically</li>
                  <li>Check your ticket status anytime on your profile</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate(`/my-tickets`)} className="flex-1">
                View My Tickets
              </Button>
              <Button onClick={() => navigate(`/events/${eventId}`)} variant="outline" className="flex-1">
                Back to Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
