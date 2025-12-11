import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import OrganizerLayout from './components/OrganizerLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ModeratorLayout from './components/ModeratorLayout.jsx';
import PartnerLayout from './components/PartnerLayout.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { Toaster } from './components/ui/sonner.jsx';

// Lazy load pages for better code splitting and performance
// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage.jsx'));

// Home page
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const MorePage = lazy(() => import('./pages/MorePage.jsx'));

// Events pages
const EventsPage = lazy(() => import('./pages/events/EventsPage.jsx'));
const EventDetailsPage = lazy(() => import('./pages/events/EventDetailsPage.jsx'));
const CreateEventPage = lazy(() => import('./pages/events/CreateEventPage.jsx'));
const EditEventPage = lazy(() => import('./pages/events/EditEventPage.jsx'));

// Clubs pages
const ClubsPage = lazy(() => import('./pages/clubs/ClubsPage.jsx'));
const ClubDetailsPage = lazy(() => import('./pages/clubs/ClubDetailsPage.jsx'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage.jsx'));
const SavedPage = lazy(() => import('./pages/SavedPage.jsx'));
const MyPostsPage = lazy(() => import('./pages/posts/MyPostsPage.jsx'));

// Services pages
const TutoringPage = lazy(() => import('./pages/services/TutoringPage.jsx'));
const ServiceDetailsPage = lazy(() => import('./pages/services/ServiceDetailsPage.jsx'));
const CreateServicePage = lazy(() => import('./pages/services/CreateServicePage.jsx'));
const MarketplacePage = lazy(() => import('./pages/services/MarketplacePage.jsx'));
const ProviderProfilePage = lazy(() => import('./pages/services/ProviderProfilePage.jsx'));

// Admin Advertisements
const AdminAdvertisementsPage = lazy(() => import('./pages/admin/AdminAdvertisementsPage.jsx'));

// Student pages
const MyRegistrationsPage = lazy(() => import('./pages/student/MyRegistrationsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage.jsx'));
const CsiDashboardPage = lazy(() => import('./pages/student/CsiDashboardPage.jsx'));
const CheckInSuccessPage = lazy(() => import('./pages/student/CheckInSuccessPage.jsx'));
const StudentScannerPage = lazy(() => import('./pages/student/StudentScannerPage.jsx'));
const PremiumPage = lazy(() => import('./pages/student/PremiumPage.jsx'));

// Organizer pages
const OrganizerPage = lazy(() => import('./pages/organizer/OrganizerPage.jsx'));
const OrganizerScannerPage = lazy(() => import('./pages/organizer/OrganizerScannerPage.jsx'));
const OrganizerAnalyticsPage = lazy(() => import('./pages/organizer/OrganizerAnalyticsPage.jsx'));
const EventQRDisplayPage = lazy(() => import('./pages/organizer/EventQRDisplayPage.jsx'));
const EventCheckInsPage = lazy(() => import('./pages/organizer/EventCheckInsPage.jsx'));
const PaymentVerificationPage = lazy(() => import('./pages/organizer/PaymentVerificationPage.jsx'));

// Moderator pages
const ModerationQueuePage = lazy(() => import('./pages/moderator/ModerationQueuePage.jsx'));
const ModeratorDashboardPage = lazy(() => import('./pages/moderator/ModeratorDashboardPage.jsx'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'));
const AdminClubsPage = lazy(() => import('./pages/admin/AdminClubsPage.jsx'));
const AdminPartnersPage = lazy(() => import('./pages/admin/AdminPartnersPage.jsx'));
const PricingSettingsPage = lazy(() => import('./pages/admin/PricingSettingsPage.jsx'));

// Payments pages
const MockPaymentPage = lazy(() => import('./pages/payments/MockPaymentPage.jsx'));
const TicketPurchasePage = lazy(() => import('./pages/payments/TicketPurchasePage.jsx'));
const TicketStatusPage = lazy(() => import('./pages/payments/TicketStatusPage.jsx'));

// Partner pages
const PartnerDashboardPage = lazy(() => import('./pages/partner/PartnerDashboardPage.jsx'));
const PartnerEventsPage = lazy(() => import('./pages/partner/PartnerEventsPage.jsx'));

/**
 * Loading spinner component shown while lazy-loaded pages are being fetched
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-red-600 mb-4"></div>
        <p className="text-slate-300 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Главный компонент приложения
 * Настраивает роутинг и оборачивает приложение в ThemeProvider и AuthProvider
 */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="bottom-right" expand={false} richColors closeButton toastOptions={{ className: 'rounded-2xl shadow-lg' }} />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Публичные маршруты без Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/mock-payment/:transactionId" element={<MockPaymentPage />} />

                {/* Публичные маршруты с Layout */}
                <Route path="/" element={<Layout><HomePage /></Layout>} />
                <Route path="/events" element={<Layout><EventsPage /></Layout>} />
                <Route path="/events/:id" element={<Layout><EventDetailsPage /></Layout>} />
                <Route path="/clubs" element={<Layout><ClubsPage /></Layout>} />
                <Route path="/clubs/:id" element={<Layout><ClubDetailsPage /></Layout>} />

                {/* Community Page - Accessible to university members */}
                <Route
                  path="/community"
                  element={
                    <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ADMIN', 'MODERATOR']}>
                      <Layout><CommunityPage /></Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Services & Tutoring (Phase 3) - Services now on homepage */}
                <Route path="/tutoring" element={<Layout><TutoringPage /></Layout>} />
                <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
                <Route path="/more" element={<Layout><MorePage /></Layout>} />
                <Route path="/services/:id" element={<Layout><ServiceDetailsPage /></Layout>} />
                <Route path="/services/provider/:id" element={<Layout><ProviderProfilePage /></Layout>} />
                <Route path="/premium" element={<Layout><PremiumPage /></Layout>} />
                <Route
                  path="/services/create"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><CreateServicePage /></Layout>
                    </ProtectedRoute>
                  }
                />


                {/* Защищенные маршруты для организаторов - требуют роль ORGANIZER */}
                <Route
                  path="/organizer/*"
                  element={
                    <ProtectedRoute roles={['ORGANIZER']}>
                      <OrganizerLayout><OrganizerRoutes /></OrganizerLayout>
                    </ProtectedRoute>
                  }
                />

                {/* External Partner Routes */}
                <Route
                  path="/partner/*"
                  element={
                    <ProtectedRoute roles={['EXTERNAL_PARTNER']}>
                      <PartnerLayout><PartnerRoutes /></PartnerLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Защищенные маршруты для студентов - требуют роль STUDENT */}
                <Route
                  path="/registrations"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><MyRegistrationsPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/csi-dashboard"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><CsiDashboardPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkin-success"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><CheckInSuccessPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/purchase"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><TicketPurchasePage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/:ticketId"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <Layout><TicketStatusPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan-event"
                  element={
                    <ProtectedRoute roles={['STUDENT']}>
                      <StudentScannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute roles={['STUDENT', 'FACULTY']}>
                      <Layout><ProfilePage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ORGANIZER', 'MODERATOR', 'ADMIN']}>
                      <Layout><SavedPage /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-posts"
                  element={
                    <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ORGANIZER', 'MODERATOR', 'ADMIN']}>
                      <Layout><MyPostsPage /></Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Защищенные маршруты для модераторов - требуют роль MODERATOR */}
                <Route
                  path="/moderator/*"
                  element={
                    <ProtectedRoute roles={['MODERATOR']}>
                      <ModeratorLayout><ModeratorRoutes /></ModeratorLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Защищенные маршруты для администратора - требуют роль ADMIN */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute roles={['ADMIN']}>
                      <AdminLayout><AdminRoutes /></AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 - не найдено */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

/**
 * Вложенные маршруты организатора
 */
function OrganizerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<OrganizerPage />} />
      <Route path="/create-event" element={<CreateEventPage />} />
      <Route path="/events/:id" element={<EventDetailsPage />} />
      <Route path="/events/:id/edit" element={<EditEventPage />} />
      <Route path="/events/:id/checkins" element={<EventCheckInsPage />} />
      <Route path="/scanner/:eventId" element={<OrganizerScannerPage />} />
      <Route path="/event-qr/:eventId" element={<EventQRDisplayPage />} />
      <Route path="/analytics" element={<OrganizerAnalyticsPage />} />
      <Route path="/payments" element={<PaymentVerificationPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

/**
 * Вложенные маршруты партнера
 */
function PartnerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PartnerDashboardPage />} />
      <Route path="/dashboard" element={<PartnerDashboardPage />} />
      <Route path="/events" element={<PartnerEventsPage />} />
      <Route path="/events/:id" element={<EventDetailsPage />} />
      <Route path="/create-event" element={<CreateEventPage />} />
      <Route path="/events/:id/edit" element={<EditEventPage />} />
      <Route path="/payments" element={<PaymentVerificationPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

/**
 * Вложенные маршруты модератора
 */
function ModeratorRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ModeratorDashboardPage />} />
      <Route path="/queue" element={<ModerationQueuePage />} />
      <Route path="/payments" element={<PaymentVerificationPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

/**
 * Вложенные маршруты администратора
 */
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardPage />} />
      <Route path="/events" element={<AdminEventsPage />} />
      <Route path="/users" element={<AdminUsersPage />} />
      <Route path="/clubs" element={<AdminClubsPage />} />
      <Route path="/pricing" element={<PricingSettingsPage />} />
      <Route path="/partners" element={<AdminPartnersPage />} />
      <Route path="/advertisements" element={<AdminAdvertisementsPage />} />
      <Route path="/payments" element={<PaymentVerificationPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

/**
 * Страница 404 - Not Found
 */
function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: '700',
          color: '#d62e1f',
          marginBottom: '1rem',
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '1rem',
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '2rem',
        }}>
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#d62e1f',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'background-color 0.2s',
          }}
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default App;
