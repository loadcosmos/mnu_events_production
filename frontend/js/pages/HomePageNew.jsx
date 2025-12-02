import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import eventsService from '../services/eventsService';
import registrationsService from '../services/registrationsService';
import adsService from '../services/adsService';
import EventModal from '../components/EventModal';
import AdBanner from '../components/AdBanner';
import AdModal from '../components/AdModal';
import { formatDate } from '../utils/dateFormatters';
import { getCsiIcon, getCsiColors } from '../utils/categoryMappers';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect organizers, admins, and partners to their pages
  useEffect(() => {
    if (isAuthenticated() && user) {
      if (user.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'EXTERNAL_PARTNER') {
        navigate('/partner', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [trendingEvents, setTrendingEvents] = useState([]);
  const [myUpcomingEvents, setMyUpcomingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalEventId, setModalEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ad state management
  const [ads, setAds] = useState({
    topBanner: null,
    nativeFeed: null,
    bottomBanner: null,
    heroSlide: [], // Array of HERO_SLIDE ads
  });
  const [selectedAd, setSelectedAd] = useState(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const openEventModal = (eventId) => {
    setModalEventId(eventId);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalEventId(null), 300);
  };

  const openAdModal = (ad) => {
    setSelectedAd(ad);
    setIsAdModalOpen(true);
  };

  const closeAdModal = () => {
    setIsAdModalOpen(false);
    setTimeout(() => setSelectedAd(null), 300);
  };

  const handleAdImpression = async (adId) => {
    try {
      await adsService.trackImpression(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad impression:', err);
    }
  };

  const handleAdClick = async (adId) => {
    try {
      await adsService.trackClick(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad click:', err);
    }
  };

  // Load events on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Load events for next 3 months
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        const response = await eventsService.getAll({
          page: 1,
          limit: 100,
          startDateFrom: today.toISOString().split('T')[0],
          startDateTo: threeMonthsLater.toISOString().split('T')[0],
        });

        if (isCancelled) return;

        // Handle different API response formats
        let eventsData = [];
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            eventsData = response;
          } else if (Array.isArray(response.data)) {
            eventsData = response.data;
          } else if (response.events && Array.isArray(response.events)) {
            eventsData = response.events;
          }
        }

        // Trending Events - Sort by registration count (most popular first)
        const trendingByPopularity = [...eventsData].sort(
          (a, b) => {
            const aCount = a._count?.registrations || 0;
            const bCount = b._count?.registrations || 0;
            // If registration counts are equal, sort by date
            if (bCount === aCount) {
              return new Date(a.startDate) - new Date(b.startDate);
            }
            return bCount - aCount;
          }
        );

        if (isCancelled) return;

        // Trending This Week - Top 6 most popular events
        setTrendingEvents(trendingByPopularity.slice(0, 6));

        // If authenticated, load user's registered events and recommendations
        if (isAuthenticated() && user) {
          try {
            const registrationsResponse = await registrationsService.getMyRegistrations();

            if (isCancelled) return;

            const registrations = registrationsResponse.data || registrationsResponse || [];

            // Extract upcoming events from registrations
            const upcomingRegistered = registrations
              .filter(reg => {
                const eventDate = new Date(reg.event?.startDate);
                return eventDate >= today && reg.status === 'REGISTERED';
              })
              .map(reg => reg.event)
              .filter(event => event) // Remove null/undefined
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .slice(0, 6);

            if (isCancelled) return;

            setMyUpcomingEvents(upcomingRegistered);

            // If user has no upcoming registrations, show recommendations based on clubs
            if (upcomingRegistered.length === 0) {
              // Get events from clubs the user is a member of
              // For now, show events sorted by date as recommendations
              // TODO: In the future, fetch user's club memberships and filter events by those clubs
              const recommendedByDate = [...eventsData]
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 6);

              setRecommendedEvents(recommendedByDate);
            } else {
              setRecommendedEvents([]);
            }
          } catch (err) {
            console.error('[HomePage] Failed to load registrations:', err);
            // Don't show error, just don't show the section
          }
        }
      } catch (err) {
        console.error('[HomePage] Load events failed:', err);
        if (isCancelled) return;

        const errorMessage =
          err.response?.data?.message
            ? Array.isArray(err.response.data.message)
              ? err.response.data.message.join(', ')
              : err.response.data.message
            : err.message || 'Failed to load events';
        setError(errorMessage);
        setTrendingEvents([]);
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
  }, [isAuthenticated, user]);

  // Load ads on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        // Load ads for different positions
        // adsService.getActive handles 404 errors gracefully and returns []
        const [topBannerAds, nativeFeedAds, bottomBannerAds, heroSlideAds] = await Promise.all([
          adsService.getActive('TOP_BANNER'),
          adsService.getActive('NATIVE_FEED'),
          adsService.getActive('BOTTOM_BANNER'),
          adsService.getActive('HERO_SLIDE'),
        ]);

        if (isCancelled) return;

        setAds({
          topBanner: topBannerAds?.[0] || null,
          nativeFeed: nativeFeedAds?.[0] || null,
          bottomBanner: bottomBannerAds?.[0] || null,
          heroSlide: heroSlideAds || [], // Store all HERO_SLIDE ads
        });
      } catch (err) {
        // Silently handle errors - ads are non-critical feature
        // Backend advertisements endpoints may not be implemented yet
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  /**
   * Mix trending events with HERO_SLIDE advertisements
   * Ratio: 3 events : 1 ad
   * Returns array of slides with type indicator
   */
  const getMixedHeroSlides = () => {
    const mixed = [];
    const heroAds = ads.heroSlide || [];
    let adIndex = 0;

    trendingEvents.forEach((event, index) => {
      // Add event slide
      mixed.push({ type: 'event', data: event });

      // After every 3 events, insert an ad (if available)
      if ((index + 1) % 3 === 0 && adIndex < heroAds.length) {
        mixed.push({ type: 'ad', data: heroAds[adIndex] });
        adIndex++;
      }
    });

    return mixed;
  };

  const mixedHeroSlides = getMixedHeroSlides();

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (mixedHeroSlides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mixedHeroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mixedHeroSlides.length]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section - Event Slider */}
      <section className="relative h-screen -mt-20 pt-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] transition-colors duration-300">
        {loading ? (
          // Loading state
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-900 dark:text-white">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f] mb-4"></div>
              <p className="text-xl">Loading events...</p>
            </div>
          </div>
        ) : mixedHeroSlides.length === 0 ? (
          // Fallback when no events
          <>
            <div className="absolute inset-0 bg-[url('/images/backg.jpg')] bg-cover bg-center opacity-20 dark:opacity-20" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
                Discover <span className="text-[#d62e1f]">Events</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-[#a0a0a0] mb-8 max-w-2xl text-center">
                Join the best university events at MNU
              </p>
              <div className="hidden md:flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="liquid-glass-red-button text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg"
                  asChild
                >
                  <Link to="/events">Explore Events</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 dark:border-[#2a2a2a] bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg px-8 transition-colors"
                  asChild
                >
                  <Link to="/clubs">View Clubs</Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Mixed Event and Ad Slider
          <>
            {mixedHeroSlides.map((slide, index) => {
              const isActive = index === currentSlide;
              const isAdSlide = slide.type === 'ad';
              const content = slide.data;
              const imageUrl = content.imageUrl || '/images/backg.jpg';

              // Track ad impression when slide becomes active
              if (isActive && isAdSlide && content.id) {
                handleAdImpression(content.id);
              }

              return (
                <div
                  key={`${slide.type}-${content.id}`}
                  className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                  {/* Background Image with Overlay */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/50" />
                  </div>

                  {isAdSlide ? (
                    /* Advertisement Slide */
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                      <div className="max-w-4xl text-center space-y-6">
                        {/* Ad Badge */}
                        <div className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold uppercase">
                          Реклама
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                          {content.title}
                        </h1>
                        <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              handleAdClick(content.id);
                              openAdModal(content);
                            }}
                            className="liquid-glass-red-button px-8 h-12 flex items-center justify-center text-white rounded-2xl font-bold text-base"
                          >
                            Узнать больше
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Event Slide */
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                      <div className="max-w-4xl text-center space-y-6">
                        <span className="inline-block bg-[#d62e1f] text-white px-4 py-2 rounded-full text-sm font-bold uppercase">
                          {content.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                          {content.title}
                        </h1>
                        <p className="text-lg md:text-xl text-[#a0a0a0] max-w-2xl mx-auto line-clamp-2">
                          {content.description || 'Join us for an amazing event!'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base text-white">
                          <div className="flex items-center gap-2">
                            <i className="fa-regular fa-calendar text-xl" />
                            <span>{formatDate(content.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-location-dot text-xl" />
                            <span>{content.location}</span>
                          </div>
                        </div>
                        <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => openEventModal(content.id)}
                            className="liquid-glass-red-button px-8 h-12 flex items-center justify-center text-white rounded-2xl font-bold text-base"
                          >
                            Learn More
                          </button>
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-8 h-12 font-bold text-base border-none"
                            asChild
                          >
                            <Link to="/events">View All Events</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slide Indicators */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                    {mixedHeroSlides.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-3 rounded-full transition-all ${idx === currentSlide
                          ? s.type === 'ad'
                            ? 'bg-yellow-500 w-8'
                            : 'bg-[#d62e1f] w-8'
                          : 'liquid-glass-subtle hover:liquid-glass w-3'
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Arrows - Hidden on mobile */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlide(
                        (prev) => (prev - 1 + mixedHeroSlides.length) % mixedHeroSlides.length
                      );
                    }}
                    className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-20 liquid-glass-button text-white p-4 rounded-2xl transition-all items-center justify-center"
                    aria-label="Previous slide"
                  >
                    <i className="fa-solid fa-chevron-left text-xl" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlide((prev) => (prev + 1) % mixedHeroSlides.length);
                    }}
                    className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 liquid-glass-button text-white p-4 rounded-2xl transition-all items-center justify-center"
                    aria-label="Next slide"
                  >
                    <i className="fa-solid fa-chevron-right text-xl" />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </section>

      {/* Top Banner Ad */}
      {ads.topBanner && (
        <AdBanner
          ad={ads.topBanner}
          position="TOP_BANNER"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* My Upcoming Events - Horizontal Scroll (Only for authenticated users) */}
      {isAuthenticated() && myUpcomingEvents.length > 0 && (
        <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  My <span className="text-[#d62e1f]">Upcoming Events</span>
                </h2>
                <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Events you're registered for</p>
              </div>
              <Link
                to="/registrations"
                className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
              >
                View All
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-6 min-w-max">
                {myUpcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                    onClick={() => openEventModal(event.id)}
                  >
                    {/* Enhanced Image with Gradient */}
                    <div className="relative">
                      <img
                        src={event.imageUrl || '/images/event-placeholder.jpg'}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/images/event-placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Enhanced Content */}
                    <div className="p-5 md:p-6 space-y-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                          {event.category}
                        </span>
                        {/* CSI Tags */}
                        {event.csiTags && event.csiTags.length > 0 && (
                          event.csiTags.map((csiTag) => {
                            const colors = getCsiColors(csiTag);
                            return (
                              <span
                                key={csiTag}
                                className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} px-2.5 py-1 rounded-lg text-xs font-semibold border`}
                              >
                                {getCsiIcon(csiTag)}
                              </span>
                            );
                          })
                        )}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                          <i className="fa-regular fa-calendar text-sm" />
                          <span className="text-sm font-medium">{formatDate(event.startDate)}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <i className="fa-solid fa-location-dot text-base text-[#d62e1f]" />
                        <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile View All Link */}
            <div className="md:hidden mt-6 text-center">
              <Link
                to="/registrations"
                className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
              >
                View All My Events
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recommended For You - Horizontal Scroll (Only for authenticated users with no registrations) */}
      {isAuthenticated() && myUpcomingEvents.length === 0 && recommendedEvents.length > 0 && (
        <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  Recommended <span className="text-[#d62e1f]">For You</span>
                </h2>
                <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Events you might enjoy based on your interests</p>
              </div>
              <Link
                to="/events"
                className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
              >
                View All
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-6 min-w-max">
                {recommendedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                    onClick={() => openEventModal(event.id)}
                  >
                    {/* Enhanced Image with Gradient */}
                    <div className="relative">
                      <img
                        src={event.imageUrl || '/images/event-placeholder.jpg'}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/images/event-placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Enhanced Content */}
                    <div className="p-4 md:p-5 lg:p-6 space-y-3 overflow-hidden">
                      {/* Category and CSI Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                          {event.category}
                        </span>
                        {/* CSI Tags */}
                        {event.csiTags && event.csiTags.length > 0 && (
                          event.csiTags.map((csiTag) => {
                            const colors = getCsiColors(csiTag);
                            return (
                              <span
                                key={csiTag}
                                className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} px-2.5 py-1 rounded-lg text-xs font-semibold border`}
                              >
                                {getCsiIcon(csiTag)}
                              </span>
                            );
                          })
                        )}
                      </div>

                      {/* Date/Time - Red and Bold */}
                      <div className="flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-sm text-[#d62e1f]" />
                        <span className="text-sm md:text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                      </div>

                      {/* Title - Large and Bold */}
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed transition-colors duration-300">
                        {event.description}
                      </p>

                      {/* Meta Info - Vertical Layout */}
                      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                          <i className="fa-solid fa-location-dot text-base text-[#d62e1f] flex-shrink-0" />
                          <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                          <i className="fa-solid fa-users text-base text-[#d62e1f] flex-shrink-0" />
                          <span className="text-sm font-semibold">
                            {event._count?.registrations || 0} / {event.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile View All Link */}
            <div className="md:hidden mt-6 text-center">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
              >
                View All Events
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Native Feed Ad */}
      {ads.nativeFeed && (
        <AdBanner
          ad={ads.nativeFeed}
          position="NATIVE_FEED"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* Trending This Week - Horizontal Scroll */}
      <section className="py-16 px-4 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Trending <span className="text-[#d62e1f]">This Week</span>
              </h2>
              <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Most popular events by registrations</p>
            </div>
            <Link
              to="/events"
              className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:text-[#ff4433] transition-colors"
            >
              View All
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2a2a2a] border-t-[#d62e1f]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-solid fa-exclamation-circle text-4xl text-[#d62e1f] mb-4"></i>
              <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">Failed to load events</p>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">{error}</p>
            </div>
          ) : trendingEvents.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <i className="fa-regular fa-calendar-xmark text-4xl text-gray-400 dark:text-[#666666] mb-4 transition-colors duration-300"></i>
              <p className="text-gray-900 dark:text-white font-semibold mb-2 transition-colors duration-300">No upcoming events</p>
              <p className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Check back later for new events!</p>
            </div>
          ) : (
            <>
              {/* Horizontal Scroll Container */}
              <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 min-w-max">
                  {trendingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="w-80 bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all cursor-pointer group shadow-lg hover:shadow-2xl"
                      onClick={() => openEventModal(event.id)}
                    >
                      {/* Enhanced Image with Gradient */}
                      <div className="relative">
                        <img
                          src={event.imageUrl || '/images/event-placeholder.jpg'}
                          alt={event.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/images/event-placeholder.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Enhanced Content */}
                      <div className="p-4 md:p-5 lg:p-6 space-y-3 overflow-hidden">
                        {/* Category and CSI Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-[#d62e1f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-md">
                            {event.category}
                          </span>
                          {/* CSI Tags */}
                          {event.csiTags && event.csiTags.length > 0 && (
                            event.csiTags.map((csiTag) => {
                              const colors = getCsiColors(csiTag);
                              return (
                                <span
                                  key={csiTag}
                                  className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} px-2.5 py-1 rounded-lg text-xs font-semibold border`}
                                >
                                  {getCsiIcon(csiTag)}
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Date/Time - Red and Bold */}
                        <div className="flex items-center gap-2">
                          <i className="fa-regular fa-calendar text-sm text-[#d62e1f]" />
                          <span className="text-sm md:text-base font-bold text-[#d62e1f]">{formatDate(event.startDate)}</span>
                        </div>

                        {/* Title - Large and Bold */}
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#d62e1f] transition-colors leading-tight">
                          {event.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed transition-colors duration-300">
                          {event.description}
                        </p>

                        {/* Meta Info - Vertical Layout */}
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            <i className="fa-solid fa-location-dot text-base text-[#d62e1f] flex-shrink-0" />
                            <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                            <i className="fa-solid fa-users text-base text-[#d62e1f] flex-shrink-0" />
                            <span className="text-sm font-semibold">
                              {event._count?.registrations || 0} / {event.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile View All Link */}
              <div className="md:hidden mt-6 text-center">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-[#d62e1f] font-semibold px-6 py-3 rounded-lg border-2 border-[#d62e1f] hover:bg-[#d62e1f] hover:text-white transition-all"
                >
                  View All Events
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Bottom Banner Ad */}
      {ads.bottomBanner && (
        <AdBanner
          ad={ads.bottomBanner}
          position="BOTTOM_BANNER"
          onImpression={handleAdImpression}
          onClick={openAdModal}
        />
      )}

      {/* Event Modal */}
      <EventModal eventId={modalEventId} isOpen={isModalOpen} onClose={closeEventModal} />

      {/* Ad Modal */}
      <AdModal ad={selectedAd} isOpen={isAdModalOpen} onClose={closeAdModal} />

      {/* Custom Scrollbar Hide Style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
