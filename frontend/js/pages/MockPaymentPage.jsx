import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import paymentsService from '../services/paymentsService';

export default function MockPaymentPage() {
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    eventTitle: searchParams.get('eventTitle') || 'Unknown Event',
    eventDate: searchParams.get('eventDate') || new Date().toISOString(),
    amount: parseInt(searchParams.get('amount')) || 0,
    eventId: searchParams.get('eventId') || '',
  });

  useEffect(() => {
    // Log payment details in development
    if (import.meta.env.DEV) {
      console.log('[MockPaymentPage] Payment details:', {
        transactionId,
        ...paymentDetails,
      });
    }
  }, [transactionId, paymentDetails]);

  const handleSuccess = async () => {
    setProcessing(true);

    try {
      // Call backend to confirm payment
      await paymentsService.confirmMockPayment(transactionId);

      toast.success('Payment successful!', {
        description: 'Your ticket has been purchased successfully.',
      });

      // Redirect to my registrations page
      navigate('/registrations', { replace: true });
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      toast.error('Payment failed', {
        description: err.response?.data?.message || 'Failed to confirm payment. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.error('Payment declined', {
      description: 'Your payment was declined. Please try again.',
    });

    setProcessing(false);

    // Redirect back to event details
    if (paymentDetails.eventId) {
      navigate(`/events/${paymentDetails.eventId}`, { replace: true });
    } else {
      navigate('/events', { replace: true });
    }
  };

  const handleError = async () => {
    setProcessing(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.error('Network error', {
      description: 'A network error occurred. Please try again later.',
    });

    setProcessing(false);

    // Redirect back to event details
    if (paymentDetails.eventId) {
      navigate(`/events/${paymentDetails.eventId}`, { replace: true });
    } else {
      navigate('/events', { replace: true });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors duration-300">
      <Card className="w-full max-w-2xl shadow-2xl liquid-glass-strong border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d62e1f] to-[#ff4433] flex items-center justify-center">
              <i className="fa-solid fa-credit-card text-white text-xl" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Mock Payment Gateway
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-500">
              🧪 Test Mode
            </Badge>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Transaction Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
              Payment Details
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] transition-colors duration-300">
                <span className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Transaction ID:</span>
                <code className="text-sm font-mono bg-white dark:bg-[#0a0a0a] px-3 py-1 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white transition-colors duration-300">
                  {transactionId}
                </code>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] transition-colors duration-300">
                <span className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Amount:</span>
                <span className="text-2xl font-bold text-[#d62e1f]">{paymentDetails.amount}₸</span>
              </div>

              <div className="flex justify-between items-start p-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] transition-colors duration-300">
                <span className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Event:</span>
                <span className="text-sm font-medium text-right text-gray-900 dark:text-white transition-colors duration-300">
                  {paymentDetails.eventTitle}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] transition-colors duration-300">
                <span className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Date:</span>
                <span className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {formatDate(paymentDetails.eventDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSuccess}
              disabled={processing}
              className="w-full py-6 text-lg liquid-glass-button bg-green-600 hover:bg-green-700 text-white border-none transition-all duration-300"
            >
              {processing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2" />
                  Successful Payment
                </>
              )}
            </Button>

            <Button
              onClick={handleDecline}
              disabled={processing}
              variant="outline"
              className="w-full py-6 text-lg border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
            >
              <i className="fa-solid fa-xmark mr-2" />
              Decline Payment
            </Button>

            <Button
              onClick={handleError}
              disabled={processing}
              variant="outline"
              className="w-full py-6 text-lg border-yellow-300 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all duration-300"
            >
              <i className="fa-solid fa-triangle-exclamation mr-2" />
              Network Error
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 transition-colors duration-300">
            <div className="flex gap-3">
              <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-300 transition-colors duration-300">
                  <strong>Test Payment Gateway</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 transition-colors duration-300">
                  This is a mock payment page for testing purposes. In production, this will be replaced with Kaspi.kz integration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
