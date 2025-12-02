import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export default function TicketView({ ticket }) {
  if (!ticket || !ticket.event) {
    return null;
  }

  const { event } = ticket;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PAID: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900/50',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      USED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const handleDownload = async () => {
    try {
      // Create a canvas element for the ticket
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions (standard ticket size)
      canvas.width = 800;
      canvas.height = 400;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#d62e1f';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Header background
      ctx.fillStyle = '#d62e1f';
      ctx.fillRect(0, 0, canvas.width, 80);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial';
      ctx.fillText('MNU Events - Your Ticket', 30, 50);

      // Event details
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(event.title || 'Event', 30, 130);

      ctx.font = '18px Arial';
      ctx.fillText(`Date: ${formatDate(event.startDate)}`, 30, 170);
      ctx.fillText(`Time: ${formatTime(event.startDate)}`, 30, 200);
      ctx.fillText(`Location: ${event.location || 'TBA'}`, 30, 230);
      ctx.fillText(`Ticket ID: ${ticket.id.slice(0, 8).toUpperCase()}`, 30, 260);

      if (ticket.price) {
        ctx.fillText(`Price: ${ticket.price}₸`, 30, 290);
      }

      // Add QR code if available
      if (ticket.qrCode) {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = ticket.qrCode;

        await new Promise((resolve, reject) => {
          qrImg.onload = () => {
            // Draw QR code on the right side
            ctx.drawImage(qrImg, 550, 120, 200, 200);
            resolve();
          };
          qrImg.onerror = reject;
        });
      }

      // Footer
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText('Please present this ticket at the entrance', 30, 360);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}-${ticket.id.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      console.log('[TicketView] Ticket downloaded successfully');
    } catch (error) {
      console.error('[TicketView] Download failed:', error);
      // Fallback: open QR code in new tab if available
      if (ticket.qrCode) {
        window.open(ticket.qrCode, '_blank');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${event.title}`,
          text: `I have a ticket for ${event.title}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('[TicketView] Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log('[TicketView] Link copied to clipboard');
    }
  };

  return (
    <Card className="liquid-glass-card border-gray-200 dark:border-[#2a2a2a] overflow-hidden transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link
              to={`/events/${event.id}`}
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-[#d62e1f] dark:hover:text-[#d62e1f] transition-colors duration-300"
            >
              {event.title}
            </Link>
            <div className="mt-2">
              <Badge className={cn(getStatusColor(ticket.status), 'transition-colors duration-300')}>
                {ticket.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Section */}
        {ticket.qrCode && ticket.status === 'PAID' && (
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
            <div className="w-48 h-48 bg-gray-100 dark:bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
              <img
                src={ticket.qrCode}
                alt="QR Code"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
              <i className="fa-solid fa-qrcode mr-1" />
              Show this QR code at the entrance
            </p>
          </div>
        )}

        {/* Ticket Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <i className="fa-regular fa-calendar text-[#d62e1f] mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Date</p>
              <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">
                {formatDate(event.startDate)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <i className="fa-regular fa-clock text-[#d62e1f] mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Time</p>
              <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">
                {formatTime(event.startDate)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <i className="fa-solid fa-location-dot text-[#d62e1f] mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Location</p>
              <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">
                {event.location}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <i className="fa-solid fa-hashtag text-[#d62e1f] mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Ticket ID</p>
              <code className="text-sm font-mono bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white transition-colors duration-300">
                {ticket.id.slice(0, 8).toUpperCase()}
              </code>
            </div>
          </div>

          {ticket.price && (
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-money-bill text-[#d62e1f] mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Price Paid</p>
                <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  {ticket.price}₸
                </p>
              </div>
            </div>
          )}

          {ticket.paymentMethod && (
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-credit-card text-[#d62e1f] mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Payment Method</p>
                <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  {ticket.paymentMethod}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {ticket.status === 'PAID' && (
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="transition-all duration-300"
            >
              <i className="fa-solid fa-download mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="transition-all duration-300"
            >
              <i className="fa-solid fa-share mr-2" />
              Share
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {ticket.status === 'USED' && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 transition-colors duration-300">
            <p className="text-sm text-blue-900 dark:text-blue-300 transition-colors duration-300">
              <i className="fa-solid fa-check-circle mr-2" />
              This ticket has been used for check-in
            </p>
          </div>
        )}

        {ticket.status === 'REFUNDED' && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <p className="text-sm text-gray-900 dark:text-gray-300 transition-colors duration-300">
              <i className="fa-solid fa-arrow-rotate-left mr-2" />
              This ticket has been refunded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
