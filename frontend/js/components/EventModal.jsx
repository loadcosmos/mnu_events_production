import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import eventsService from '../services/eventsService';
import registrationsService from '../services/registrationsService';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function EventModal({ eventId, isOpen, onClose }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset state when modal closes or eventId changes
  useEffect(() => {
    if (!isOpen || !eventId) {
      setEvent(null);
      setError('');
      setIsRegistered(false);
      setMyRegistration(null);
      setRegistering(false);
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    console.log('[EventModal] State changed:', { isOpen, eventId });
    if (isOpen && eventId) {
      loadEventDetails();
      if (user) {
        checkRegistration();
      }
    }
  }, [isOpen, eventId, user]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventsService.getById(eventId);
      setEvent(data);
    } catch (err) {
      console.error('[EventModal] Failed to load event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const response = await registrationsService.getMyRegistrations();
      const registrations = Array.isArray(response) ? response : (response.data || response.registrations || []);
      const registration = registrations.find(r => r.eventId === eventId);
      if (registration) {
        setIsRegistered(true);
        setMyRegistration(registration);
      } else {
        setIsRegistered(false);
        setMyRegistration(null);
      }
    } catch (err) {
      console.error('[EventModal] Check registration failed:', err);
      setIsRegistered(false);
      setMyRegistration(null);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please log in to register for events');
      return;
    }

    if (!eventId) {
      toast.error('Invalid event');
      return;
    }

    try {
      setRegistering(true);
      await registrationsService.register(eventId);
      toast.success('Successfully registered for event!');
      onClose();
    } catch (err) {
      console.error('[EventModal] Registration failed:', err);
      const errorMessage = err.response?.data?.message
        ? (Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message)
        : err.message || 'Failed to register for event';
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleBuyTicket = async () => {
    if (!user) {
      toast.error('Please log in to buy tickets');
      onClose();
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);

      toast.info('Redirecting to payment gateway...', {
        description: 'You will be redirected to complete your purchase.',
      });

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare payment params
      const paymentParams = new URLSearchParams({
        eventTitle: event.title,
        eventDate: event.startDate,
        amount: event.price.toString(),
        eventId: event.id,
      });

      // Close modal and navigate
      onClose();
      navigate(`/mock-payment/${transactionId}?${paymentParams.toString()}`);
    } catch (err) {
      console.error('[EventModal] Buy ticket failed:', err);
      toast.error('Failed to initiate payment');
    } finally {
      setRegistering(false);
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const date = d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { date, time };
  };

  const getCategoryColor = (category) => {
    const colors = {
      CULTURAL: 'bg-purple-100 text-purple-800',
      SOCIAL: 'bg-green-100 text-green-800',
      ACADEMIC: 'bg-blue-100 text-blue-800',
      TECH: 'bg-blue-100 text-blue-800',
      SPORTS: 'bg-green-100 text-green-800',
      CAREER: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Backdrop with blur */}
      <div
        className="absolute inset-0 liquid-glass-overlay transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modern Modal Content - Single Column Layout with Liquid Glass */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto liquid-glass-strong rounded-2xl shadow-2xl transform transition-all duration-300 scale-100">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f]"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <i className="fa-solid fa-exclamation-circle text-4xl text-[#d62e1f] mb-4"></i>
            <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">{error}</p>
          </div>
        ) : event ? (
          <>
            {/* Hero Image with Overlay Information */}
            {event.imageUrl && (
              <div className="relative h-72 md:h-96 overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/event-placeholder.jpg';
                  }}
                />

                {/* Dark gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                {/* Category Badge - Top Left */}
                <div className="absolute top-4 left-4">
                  <span className="inline-block bg-[#d62e1f] text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide shadow-lg">
                    {event.category}
                  </span>
                </div>

                {/* Meta Info Overlay - Bottom Section - Liquid Glass Cards */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Date */}
                    <div className="flex items-center gap-2.5 liquid-glass px-3 py-2.5 rounded-lg shadow-lg transition-colors duration-300">
                      <i className="fa-regular fa-calendar text-[#d62e1f] text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-semibold mb-0.5">Date</p>
                        <p className="text-sm font-bold text-white truncate">
                          {formatDate(event.startDate).date}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2.5 liquid-glass px-3 py-2.5 rounded-lg shadow-lg transition-colors duration-300">
                      <i className="fa-solid fa-clock text-[#d62e1f] text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-semibold mb-0.5">Time</p>
                        <p className="text-sm font-bold text-white truncate">
                          {formatDate(event.startDate).time}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2.5 liquid-glass px-3 py-2.5 rounded-lg shadow-lg transition-colors duration-300">
                      <i className="fa-solid fa-location-dot text-[#d62e1f] text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-semibold mb-0.5">Location</p>
                        <p className="text-sm font-bold text-white truncate">
                          {event.location}
                        </p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-2.5 liquid-glass px-3 py-2.5 rounded-lg shadow-lg transition-colors duration-300">
                      <i className="fa-solid fa-users text-[#d62e1f] text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-semibold mb-0.5">Capacity</p>
                        <p className="text-sm font-bold text-white truncate">
                          {event._count?.registrations || 0} / {event.capacity}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Organizer Section - Above Title */}
              {event.creator && (
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d62e1f]/30 to-[#d62e1f]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-[#d62e1f]">
                        {event.creator.firstName?.[0]}{event.creator.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-[#a0a0a0] font-semibold mb-0.5 transition-colors duration-300">Organized by</p>
                      <p className="font-bold text-gray-900 dark:text-white text-base truncate transition-colors duration-300">
                        {event.creator.firstName} {event.creator.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Go to Club Button */}
                  {event.clubId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(`/clubs/${event.clubId}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white rounded-lg font-semibold text-sm transition-colors flex-shrink-0"
                    >
                      <i className="fa-solid fa-arrow-right text-[#d62e1f]" />
                      <span className="hidden sm:inline">Go to Club</span>
                    </button>
                  )}
                </div>
              )}

              {/* Event Title - Large and Bold */}
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight transition-colors duration-300">
                {event.title}
              </h2>

              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">About this event</h3>
                <p className="text-gray-700 dark:text-[#a0a0a0] text-base leading-relaxed transition-colors duration-300">
                  {event.description || 'No description provided.'}
                </p>
              </div>

              {/* Price Section for Paid Events */}
              {event.isPaid && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#d62e1f]/5 to-[#d62e1f]/10 border-2 border-[#d62e1f]/20 transition-all duration-300">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mb-1 transition-colors duration-300">Ticket Price</p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{event.price}₸</p>
                    </div>
                    <Badge className="bg-[#d62e1f] text-white border-none hover:bg-[#d62e1f]/90 transition-colors duration-300">
                      Paid Event
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Charity donation</span>
                      <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{(event.price - (event.platformFee || 0))}₸</span>
                    </div>
                    {event.platformFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Platform fee</span>
                        <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{event.platformFee}₸</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                      <i className="fa-solid fa-users" />
                      <span>{event.availableSeats <= 0 ? 'Sold out' : `${event.availableSeats} tickets left`}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                {isRegistered && myRegistration ? (
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 transition-colors duration-300">
                    <p className="text-base font-semibold text-green-800 dark:text-green-400 transition-colors duration-300 flex items-center gap-2">
                      <i className="fa-solid fa-check-circle" />
                      ✓ You are registered
                    </p>
                    {myRegistration.status === 'WAITLIST' && (
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1 transition-colors duration-300">
                        You are on the waitlist
                      </p>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/registrations');
                      }}
                      className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      View My Registrations
                    </button>
                  </div>
                ) : event.isPaid ? (
                  <button
                    onClick={handleBuyTicket}
                    disabled={registering || !user || event.availableSeats <= 0}
                    className="w-full px-6 py-4 liquid-glass-red-button text-white rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {registering ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2 text-lg" />
                        Processing...
                      </>
                    ) : event.availableSeats <= 0 ? (
                      <>
                        <i className="fa-solid fa-ban mr-2 text-lg" />
                        Sold Out
                      </>
                    ) : user ? (
                      <>
                        <i className="fa-solid fa-credit-card mr-2 text-lg" />
                        Buy Ticket - {event.price}₸
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-sign-in mr-2 text-lg" />
                        Login to Buy Ticket
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering || !user}
                    className="w-full px-6 py-4 liquid-glass-red-button text-white rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {registering ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2 text-lg" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-ticket mr-2 text-lg" />
                        {user ? 'Register for Event' : 'Login to Register'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
