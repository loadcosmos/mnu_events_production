import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import QRScannerModal from '../../components/QRScannerModal';
import eventsService from '../../services/eventsService';
import registrationsService from '../../services/registrationsService';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { Camera, CheckCircle } from 'lucide-react';
import { sanitizeText } from '../../utils/sanitize';
import { useTranslation, Trans } from 'react-i18next'; // Added

export default function EventDetailsPage() {
  const { t, i18n } = useTranslation(); // Added
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [hasPaidTicket, setHasPaidTicket] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false); // Added missing state

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await eventsService.getById(id);

        if (isCancelled) return;

        setEvent(data);

        // Debug: логируем даты для отладки
        if (import.meta.env.DEV && data) {
          const eventEndDate = new Date(data.endDate);
          const now = new Date();
          console.log('[EventDetailsPage] Date debug:', {
            eventEndDate: eventEndDate.toISOString(),
            now: now.toISOString(),
            eventEndDateLocal: eventEndDate.toLocaleString(),
            nowLocal: now.toLocaleString(),
            isPast: eventEndDate < now,
            diff: eventEndDate.getTime() - now.getTime(),
          });
        }
      } catch (err) {
        if (isCancelled) return;

        setError(err.message || t('common.error'));
        console.error('[EventDetailsPage] Load event failed:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    let isCancelled = false;

    const checkReg = async () => {
      try {
        const response = await registrationsService.getMyRegistrations();

        if (isCancelled) return;

        // API может вернуть массив или объект с data
        const registrations = Array.isArray(response) ? response : (response.data || response.registrations || []);
        const registration = registrations.find(r => r.eventId === id);
        if (registration) {
          setIsRegistered(true);
          setMyRegistration(registration);
        }
      } catch (err) {
        console.error('[EventDetailsPage] Check registration failed:', err);
      }
    };

    checkReg();

    return () => {
      isCancelled = true;
    };
  }, [id, isAuthenticated, user]);

  // Simplified reload function for updating event after registration changes
  const loadEvent = async () => {
    try {
      const data = await eventsService.getById(id);
      setEvent(data);
    } catch (err) {
      console.error('[EventDetailsPage] Reload event failed:', err);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    try {
      setRegistering(true);
      setError('');
      await registrationsService.register(id);
      setIsRegistered(true);
      toast.success(t('events.youAreRegistered'), { // Simplified success message
        description: t('events.youAreRegistered'),
      });
      // Перезагружаем событие для обновления availableSeats
      await loadEvent();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('auth.registrationFailed'));
      console.error('[EventDetailsPage] Register failed:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleBuyTicket = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    // Redirect to purchase page (works for external events)
    navigate(`/events/${id}/purchase`);
  };

  const handleCancelRegistration = async () => {
    if (!myRegistration) return;

    try {
      setRegistering(true);
      setError('');
      await registrationsService.cancel(myRegistration.id);
      setIsRegistered(false);
      setMyRegistration(null);
      toast.success(t('common.success'), {
        description: t('events.cancelRegistration') + ' ' + t('common.success'),
      });
      // Перезагружаем событие для обновления availableSeats
      await loadEvent();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel registration');
      console.error('[EventDetailsPage] Cancel registration failed:', err);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    const locale = i18n.language === 'kz' ? 'kk' : (i18n.language || 'en');
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      }),
      full: date.toLocaleString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase();
    const colors = {
      creativity: 'bg-purple-100 text-purple-800 border-purple-200',
      service: 'bg-green-100 text-green-800 border-green-200',
      intelligence: 'bg-blue-100 text-blue-800 border-blue-200',
      tech: 'bg-blue-100 text-blue-800 border-blue-200',
      academic: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      UPCOMING: 'bg-green-100 text-green-800 border-green-200',
      ONGOING: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('common.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate('/events')} variant="outline">
              {t('events.backToEvents')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const startDate = formatDate(event.startDate);
  const endDate = formatDate(event.endDate);
  const isFull = event.availableSeats <= 0;
  // Проверяем, закончилось ли событие, сравнивая endDate с текущей датой/временем
  // event.endDate может быть строкой или Date объектом, поэтому парсим его явно
  // Используем getTime() для точного сравнения timestamp, чтобы избежать проблем с часовыми поясами
  const eventEndDate = new Date(event.endDate);
  const now = new Date();
  const isPast = eventEndDate.getTime() < now.getTime();

  // Debug в development режиме
  if (import.meta.env.DEV) {
    console.log('[EventDetailsPage] Event status check:', {
      eventEndDate: eventEndDate.toISOString(),
      now: now.toISOString(),
      eventEndDateTimestamp: eventEndDate.getTime(),
      nowTimestamp: now.getTime(),
      isPast,
      diffMs: eventEndDate.getTime() - now.getTime(),
      diffDays: Math.floor((eventEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-6"
        >
          ← {t('events.backToEvents')}
        </Button>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            {event.imageUrl && (
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className={cn(getCategoryColor(event.category))}>
                    {event.category}
                  </Badge>
                </div>
                {event.status && (
                  <div className="absolute top-4 left-4">
                    <Badge className={cn(getStatusBadge(event.status))}>
                      {event.status}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Title and Description */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                    {event.creator && (
                      <CardDescription className="text-base">
                        {t('events.organizedBy')} {event.creator.firstName} {event.creator.lastName}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line">
                    {sanitizeText(event.description)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('events.eventDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date & Time */}
                <div>
                  <div className="flex items-center gap-3 text-base md:text-lg text-muted-foreground mb-2">
                    <i className="fa-regular fa-calendar text-xl text-primary" />
                    <span className="font-semibold">{t('events.start')}</span>
                  </div>
                  <p className="text-base md:text-lg font-medium pl-8">{startDate.full}</p>
                </div>

                {event.endDate && event.endDate !== event.startDate && (
                  <div>
                    <div className="flex items-center gap-3 text-base md:text-lg text-muted-foreground mb-2">
                      <i className="fa-regular fa-calendar text-xl text-primary" />
                      <span className="font-semibold">{t('events.end')}</span>
                    </div>
                    <p className="text-base md:text-lg font-medium pl-8">{endDate.full}</p>
                  </div>
                )}

                {/* Location */}
                <div>
                  <div className="flex items-center gap-3 text-base md:text-lg text-muted-foreground mb-2">
                    <i className="fa-solid fa-location-dot text-xl text-primary" />
                    <span className="font-semibold">{t('events.location')}</span>
                  </div>
                  <p className="text-base md:text-lg pl-8">{event.location}</p>
                </div>

                {/* Capacity */}
                <div>
                  <div className="flex items-center gap-3 text-base md:text-lg text-muted-foreground mb-2">
                    <i className="fa-solid fa-users text-xl text-primary" />
                    <span className="font-semibold">{t('events.capacity')}</span>
                  </div>
                  <p className="text-base md:text-lg pl-8">
                    {event.availableSeats} of {event.capacity} seats available
                  </p>
                  {isFull && (
                    <p className="text-base text-destructive mt-2 pl-8 font-medium">{t('events.eventFull')}</p>
                  )}
                </div>

                {/* Price Section for Paid Events */}
                {event.isPaid && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#d62e1f]/5 to-[#d62e1f]/10 border-2 border-[#d62e1f]/20 transition-all duration-300">
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mb-1 transition-colors duration-300">{t('events.price')}</p>
                          <p className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{event.price}₸</p>
                        </div>
                        <Badge className="bg-[#d62e1f] text-white border-none hover:bg-[#d62e1f]/90 transition-colors duration-300">
                          {t('events.paidEvent')}
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">{t('events.charityDonation')}</span>
                          <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{(event.price - (event.platformFee || 0))}₸</span>
                        </div>
                        {event.platformFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">{t('events.platformFee')}</span>
                            <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{event.platformFee}₸</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                          <i className="fa-solid fa-users" />
                          <span>{isFull ? t('events.soldOut') : t('events.ticketsLeft', { count: event.availableSeats })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Status */}
                {!event.isPaid && isRegistered && myRegistration && (
                  <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 transition-colors duration-300">
                    <p className="text-base md:text-lg font-semibold text-green-800 dark:text-green-400 transition-colors duration-300">
                      ✓ {t('events.youAreRegistered')}
                    </p>
                    {myRegistration.status === 'WAITLIST' && (
                      <p className="text-sm md:text-base text-green-600 dark:text-green-500 mt-1 transition-colors duration-300">
                        {t('events.youAreOnWaitlist')}
                      </p>
                    )}
                  </div>
                )}

                {/* Ticket Status for Paid Events */}
                {event.isPaid && hasPaidTicket && (
                  <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 transition-colors duration-300">
                    <p className="text-base md:text-lg font-semibold text-green-800 dark:text-green-400 transition-colors duration-300">
                      ✓ {t('events.ticketPurchased')}
                    </p>
                    <Link
                      to="/registrations"
                      className="text-sm md:text-base text-green-600 dark:text-green-500 hover:underline mt-1 inline-block transition-colors duration-300"
                    >
                      {t('events.viewTicket')} →
                    </Link>
                  </div>
                )}

                {/* Action Buttons - только для студентов */}
                {!isPast && user?.role === 'STUDENT' && (
                  <div className="space-y-3 pt-4">
                    {event.isPaid ? (
                      /* Paid Event Actions */
                      hasPaidTicket ? (
                        <Button
                          variant="outline"
                          className="w-full text-base md:text-lg py-6 transition-all duration-300"
                          onClick={() => navigate('/registrations')}
                        >
                          {t('events.viewMyTicket')}
                        </Button>
                      ) : (
                        <Button
                          className="w-full text-base md:text-lg py-6 liquid-glass-red-button text-white transition-all duration-300"
                          onClick={handleBuyTicket}
                          disabled={registering || isFull || !isAuthenticated()}
                        >
                          {registering ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin mr-2" />
                              {t('common.processing')}
                            </>
                          ) : !isAuthenticated() ? (
                            <>
                              <i className="fa-solid fa-sign-in mr-2" />
                              {t('auth.loginToBuyTicket')}
                            </>
                          ) : isFull ? (
                            <>
                              <i className="fa-solid fa-ban mr-2" />
                              {t('events.soldOut')}
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-credit-card mr-2" />
                              {t('events.buyTicket')} - {event.price}₸
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      /* Free Event Actions */
                      isRegistered ? (
                        <Button
                          variant="outline"
                          className="w-full text-base md:text-lg py-6 transition-all duration-300"
                          onClick={handleCancelRegistration}
                          disabled={registering}
                        >
                          {registering ? t('events.cancelling') : t('events.cancelRegistration')}
                        </Button>
                      ) : (
                        <Button
                          className="w-full text-base md:text-lg py-6 liquid-glass-red-button text-white transition-all duration-300"
                          onClick={handleRegister}
                          disabled={registering || isFull || !isAuthenticated()}
                        >
                        >
                          {registering
                            ? t('events.registering')
                            : !isAuthenticated()
                              ? t('auth.loginToRegister')
                              : isFull
                                ? t('events.eventFull')
                                : t('events.registerForEvent')}
                        </Button>
                      )
                    )}

                    {/* QR Check-in Button for Free Events */}
                    {!event.isPaid && isRegistered && event.checkInMode === 'STUDENTS_SCAN' && (
                      <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                        {!hasCheckedIn ? (
                          <Button
                            variant="outline"
                            className="w-full text-base md:text-lg py-6 border-2 border-[#d62e1f] text-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all duration-300"
                            onClick={() => setShowQRScanner(true)}
                          >
                            <i className="fa-solid fa-qrcode mr-2" />
                            {t('events.checkInWithQr')}
                          </Button>
                        ) : (
                          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                            <p className="text-base font-semibold text-green-800 dark:text-green-400 text-center">
                              <i className="fa-solid fa-check-circle mr-2" />
                              {t('events.checkedIn')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!isAuthenticated() && (
                      <p className="text-sm md:text-base text-center text-muted-foreground transition-colors duration-300">
                        <Trans
                          i18nKey="events.signInToRegister"
                          values={{ action: event.isPaid ? t('events.buyTicketAction') : t('events.registerAction') }}
                          components={{ 1: <Link to="/login" className="text-[#d62e1f] hover:underline font-medium transition-colors duration-300" /> }}
                        />
                      </p>
                    )}

                    {/* Check-in button for STUDENTS_SCAN mode */}
                    {event.checkInMode === 'STUDENTS_SCAN' && isRegistered && !hasCheckedIn && (
                      <Button
                        className="w-full text-base md:text-lg py-6 liquid-glass-red-button text-white transition-all duration-300"
                        onClick={() => setShowQRScanner(true)}
                        disabled={checkInLoading} // Note: checkInLoading is undefined in original file, assuming it exists or handled
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        {t('events.checkInWithQr')}
                      </Button>
                    )}

                    {/* Check-in success message */}
                    {hasCheckedIn && (
                      <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 transition-colors duration-300 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="text-base font-semibold text-green-800 dark:text-green-400 transition-colors duration-300">
                          {t('events.checkedIn')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопки управления для организатора события */}
                {isAuthenticated() && user?.role === 'ORGANIZER' && (event.creatorId === user.id || event.creator?.id === user.id) && (
                  <div className="space-y-3 mt-4">
                    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-3">
                        {t('events.eventManagement')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/organizer/event-qr/${event.id}`}>
                          <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                            <i className="fa-solid fa-desktop mr-1" />
                            {t('events.qrDisplay')}
                          </Button>
                        </Link>
                        <Link to={`/organizer/scanner/${event.id}`}>
                          <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                            <i className="fa-solid fa-qrcode mr-1" />
                            {t('events.scanTickets')}
                          </Button>
                        </Link>
                        <Link to={`/organizer/events/${event.id}/checkins`}>
                          <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                            <i className="fa-solid fa-users mr-1" />
                            {t('events.viewCheckins')}
                          </Button>
                        </Link>
                        <Link to={`/organizer/events/${event.id}/edit`}>
                          <Button variant="outline" size="sm" className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white">
                            <i className="fa-solid fa-edit mr-1" />
                            {t('events.manage')}
                          </Button>
                        </Link>
                        <Link to="/organizer/analytics">
                          <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                            <i className="fa-solid fa-chart-line mr-1" />
                            {t('events.analytics')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Сообщение для организаторов чужих событий и админов */}
                {!isPast && isAuthenticated() && user?.role !== 'STUDENT' &&
                  !(user?.role === 'ORGANIZER' && (event.creatorId === user.id || event.creator?.id === user.id)) && (
                    <div className="p-4 rounded-md bg-gray-50 border border-gray-200 mt-4">
                      <p className="text-sm md:text-base text-muted-foreground text-center">
                        {user?.role === 'ORGANIZER'
                          ? t('events.manageOwnEvents')
                          : t('events.onlyStudentsCanRegister')}
                      </p>
                    </div>
                  )}

                {isPast && (
                  <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
                    <p className="text-sm md:text-base text-muted-foreground text-center font-medium">
                      {t('events.eventEnded')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScannerModal
            event={event}
            onSuccess={(response) => {
              setHasCheckedIn(true);
              toast.success('Check-in successful!');
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </div>
  );
}


