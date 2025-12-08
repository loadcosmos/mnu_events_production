import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventsService from '../services/eventsService';
import registrationsService from '../services/registrationsService';
import adsService from '../services/adsService';
import EventModal from '../components/EventModal';
import AdBanner from '../components/AdBanner';
import AdModal from '../components/AdModal';

// Extracted home page components
import { HeroSlider, MarketplaceSection, EventsHorizontalScroll } from './home';

/**
 * HomePage - Main landing page
 * Orchestrates hero slider, marketplace, and events sections
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect organizers and admins to their pages
  useEffect(() => {
    if (isAuthenticated() && user) {
      if (user.role === 'ORGANIZER') {
        navigate('/organizer', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Events state
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [myUpcomingEvents, setMyUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Modal state
  const [modalEventId, setModalEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ad state
  const [ads, setAds] = useState({
    topBanner: null,
    nativeFeed: null,
    bottomBanner: null,
  });
  const [selectedAd, setSelectedAd] = useState(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Event modal handlers
  const openEventModal = (eventId) => {
    setModalEventId(eventId);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalEventId(null), 300);
  };

  // Ad modal handlers
  const openAdModal = (ad) => {
    setSelectedAd(ad);
    setIsAdModalOpen(true);
  };

  const closeAdModal = () => {
    setIsAdModalOpen(false);
    setTimeout(() => setSelectedAd(null), 300);
  };

  const handleAdClick = async (adId) => {
    try {
      await adsService.trackClick(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad click:', err);
    }
  };

  const handleAdImpression = async (adId) => {
    try {
      await adsService.trackImpression(adId);
    } catch (err) {
      console.error('[HomePage] Failed to track ad impression:', err);
    }
  };

  // Load events
  useEffect(() => {
    let isCancelled = false;

    const loadEvents = async () => {
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

        // Trending Events - Sort by registration count
        const trendingByPopularity = [...eventsData].sort((a, b) => {
          const aCount = a._count?.registrations || 0;
          const bCount = b._count?.registrations || 0;
          if (bCount === aCount) {
            return new Date(a.startDate) - new Date(b.startDate);
          }
          return bCount - aCount;
        });

        if (isCancelled) return;
        setTrendingEvents(trendingByPopularity.slice(0, 6));

        // Load user's registered events if authenticated
        if (isAuthenticated() && user) {
          try {
            const registrationsResponse = await registrationsService.getMyRegistrations();
            if (isCancelled) return;

            const registrations = registrationsResponse.data || registrationsResponse || [];
            const upcomingRegistered = registrations
              .filter(reg => {
                const eventDate = new Date(reg.event?.startDate);
                return eventDate >= today && reg.status === 'REGISTERED';
              })
              .map(reg => reg.event)
              .filter(event => event)
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .slice(0, 6);

            if (isCancelled) return;
            setMyUpcomingEvents(upcomingRegistered);
          } catch (err) {
            console.error('[HomePage] Failed to load registrations:', err);
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

    loadEvents();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user]);

  // Load ads
  useEffect(() => {
    let isCancelled = false;

    const loadAds = async () => {
      try {
        const [topBannerAds, nativeFeedAds, bottomBannerAds] = await Promise.all([
          adsService.getActive('TOP_BANNER'),
          adsService.getActive('NATIVE_FEED'),
          adsService.getActive('BOTTOM_BANNER'),
        ]);

        if (isCancelled) return;

        setAds({
          topBanner: topBannerAds?.[0] || null,
          nativeFeed: nativeFeedAds?.[0] || null,
          bottomBanner: bottomBannerAds?.[0] || null,
        });
      } catch (err) {
        console.error('[HomePage] Failed to load ads:', err);
      }
    };

    loadAds();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Auto-advance hero slides
  useEffect(() => {
    if (trendingEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [trendingEvents.length]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section - Event Slider */}
      <HeroSlider
        events={trendingEvents}
        loading={loading}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        onEventClick={openEventModal}
      />

      {/* Top Banner Ad */}
      {ads.topBanner && (
        <AdBanner
          ad={ads.topBanner}
          position="TOP_BANNER"
          onImpression={handleAdImpression}
          onClick={handleAdClick}
        />
      )}

      {/* Services/Marketplace Section */}
      <MarketplaceSection />

      {/* My Upcoming Events - Only for authenticated users */}
      {isAuthenticated() && myUpcomingEvents.length > 0 && (
        <EventsHorizontalScroll
          title="My"
          titleHighlight="Upcoming Events"
          subtitle="Events you're registered for"
          events={myUpcomingEvents}
          loading={false}
          onEventClick={openEventModal}
          viewAllLink="/registrations"
          emptyMessage="No upcoming events"
          emptyDescription="Register for events to see them here!"
        />
      )}

      {/* Native Feed Ad */}
      {ads.nativeFeed && (
        <AdBanner
          ad={ads.nativeFeed}
          position="NATIVE_FEED"
          onImpression={handleAdImpression}
          onClick={handleAdClick}
        />
      )}

      {/* Trending This Week */}
      <EventsHorizontalScroll
        title="Trending"
        titleHighlight="This Week"
        subtitle="Most popular events by registrations"
        events={trendingEvents}
        loading={loading}
        error={error}
        onEventClick={openEventModal}
        viewAllLink="/events"
        emptyMessage="No upcoming events"
        emptyDescription="Check back later for new events!"
      />

      {/* Bottom Banner Ad */}
      {ads.bottomBanner && (
        <AdBanner
          ad={ads.bottomBanner}
          position="BOTTOM_BANNER"
          onImpression={handleAdImpression}
          onClick={handleAdClick}
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
