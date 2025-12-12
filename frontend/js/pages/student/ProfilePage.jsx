import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import usersService from '../../services/usersService';
import registrationsService from '../../services/registrationsService';
import analyticsService from '../../services/analyticsService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import GamificationCard from '../../components/Gamification/GamificationCard';
import { SavedEventsTab, EditInterestsSection, FollowStats } from '../../components/profile';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    eventsAttended: 0,
    upcomingEvents: 0,
    clubsJoined: 0,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    faculty: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadUserData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Load user profile
      const userData = await usersService.getById(currentUser.id);
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        faculty: userData.faculty || '',
        avatar: userData.avatar || '',
      });

      // Load user stats from analytics service only for students
      if (currentUser.role === 'STUDENT') {
        try {
          const analyticsData = await analyticsService.getStudentStats(currentUser.id);

          setStats({
            eventsAttended: analyticsData.eventsAttended || 0,
            upcomingEvents: analyticsData.upcomingEvents || 0,
            clubsJoined: analyticsData.clubsJoined || 0,
          });
        } catch (err) {
          console.error('[ProfilePage] Failed to load analytics:', err);

          // Fallback to manual calculation if analytics service fails
          try {
            const registrationsResponse = await registrationsService.getMyRegistrations();
            const registrations = registrationsResponse.data || registrationsResponse || [];

            const today = new Date();
            const attended = registrations.filter(
              reg => reg.checkedInAt && new Date(reg.event?.startDate) < today
            ).length;
            const upcoming = registrations.filter(
              reg => reg.status === 'REGISTERED' && new Date(reg.event?.startDate) >= today
            ).length;

            setStats({
              eventsAttended: attended,
              upcomingEvents: upcoming,
              clubsJoined: 0,
            });
          } catch (fallbackErr) {
            console.error('[ProfilePage] Fallback stats calculation failed:', fallbackErr);
          }
        }
      }
    } catch (err) {
      console.error('[ProfilePage] Load user failed:', err);
      toast.error('Failed to load profile', {
        description: err.message || 'Unable to load your profile information.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (currentUser?.id) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error(t('profile.validationFailed'), {
        description: t('profile.requiredFields'),
      });
      return;
    }

    try {
      setSaving(true);

      await usersService.update(currentUser.id, formData);
      await loadUserData();
      setIsEditModalOpen(false);

      toast.success(t('profile.profileUpdated'), {
        description: t('profile.profileInfoSaved'),
      });
    } catch (err) {
      console.error('[ProfilePage] Update failed:', err);
      toast.error(t('profile.updateFailed'), {
        description: err.message || t('profile.unableToSave'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile`;

    if (navigator.share) {
      navigator.share({
        title: t('profile.shareTitle'),
        text: t('profile.shareText', { name: `${user?.firstName} ${user?.lastName}` }),
        url: profileUrl,
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success(t('profile.linkCopied'), {
        description: t('profile.linkCopiedDesc'),
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[#d62e1f]';
      case 'ORGANIZER':
        return 'bg-orange-600';
      case 'STUDENT':
        return 'bg-blue-600';
      case 'FACULTY':
        return 'bg-purple-600';
      default:
        return 'bg-[#2a2a2a]';
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.invalidFileType'), {
        description: t('profile.allowedFileTypes'),
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('common.fileTooLarge'), {
        description: t('common.maxFileSize'),
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const result = await usersService.uploadAvatar(file);

      // Update local state
      setUser(prev => ({ ...prev, avatar: result.avatarUrl }));
      setFormData(prev => ({ ...prev, avatar: result.avatarUrl }));

      toast.success(t('common.avatarUpdated'), {
        description: t('common.avatarUpdatedDesc'),
      });
    } catch (err) {
      console.error('[ProfilePage] Avatar upload failed:', err);
      toast.error(t('common.uploadFailed'), {
        description: err.message || t('common.uploadFailed'),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="text-center text-gray-900 dark:text-white transition-colors duration-300">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-[#2a2a2a] border-t-[#d62e1f] mb-4"></div>
          <p className="text-xl">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center">
          <p className="text-[#d62e1f] mb-4">Failed to load profile</p>
          <Button onClick={loadUserData} className="liquid-glass-red-button text-white rounded-2xl">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24 md:pb-8 transition-colors duration-300">
      {/* Hero Section with Avatar and User Info */}
      <div className="bg-gradient-to-b from-gray-200 via-gray-100 to-gray-50 dark:from-[#1a1a1a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] py-8 px-4 border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] mb-4 ring-4 ring-[#d62e1f]/20 transition-colors duration-300">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white bg-gradient-to-br from-[#d62e1f] to-[#b91c1c]',
                  user.avatar && 'hidden'
                )}
              >
                {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 dark:text-[#a0a0a0] text-sm md:text-base mb-3 transition-colors duration-300">{user.email}</p>

            <div className="flex items-center gap-3 mb-2">
              <span className={cn('px-4 py-1.5 rounded-full text-white text-sm font-semibold', getRoleBadgeColor(user.role))}>
                {user.role}
              </span>
              {user.faculty && (
                <span className="px-4 py-1.5 rounded-full bg-gray-300 dark:bg-[#2a2a2a] text-gray-900 dark:text-white text-sm font-semibold transition-colors duration-300">
                  {user.faculty}
                </span>
              )}
            </div>

            {/* Follow Stats */}
            <div className="flex justify-center mb-4">
              <FollowStats userId={currentUser?.id} isOwnProfile={true} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 liquid-glass-red-button text-white font-semibold rounded-2xl"
            >
              <i className="fa-solid fa-pen-to-square mr-2" />
              Edit Profile
            </button>
            <button
              onClick={handleShareProfile}
              className="px-6 py-3 bg-gray-300 dark:bg-[#2a2a2a] hover:bg-gray-400 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              <i className="fa-solid fa-share-nodes mr-2" />
              Share Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {currentUser?.role === 'STUDENT' && (
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-gray-100 dark:bg-white/5 p-1">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all gap-2"
                >
                  <i className="fa-solid fa-user text-sm" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all gap-2"
                >
                  <i className="fa-solid fa-bookmark text-sm" />
                  Saved
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all gap-2"
                >
                  <i className="fa-solid fa-gear text-sm" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {currentUser?.role === 'STUDENT' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            {/* My Stats Section */}
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                  My <span className="text-[#d62e1f]">Stats</span>
                </h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 text-center border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all shadow-lg hover:shadow-2xl">
                    <div className="text-3xl md:text-4xl font-extrabold text-[#d62e1f] mb-2">
                      {stats.eventsAttended}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-[#a0a0a0] font-semibold">Events Attended</div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 text-center border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all shadow-lg hover:shadow-2xl">
                    <div className="text-3xl md:text-4xl font-extrabold text-[#d62e1f] mb-2">
                      {stats.upcomingEvents}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-[#a0a0a0] font-semibold">Upcoming Events</div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 text-center border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all shadow-lg hover:shadow-2xl">
                    <div className="text-3xl md:text-4xl font-extrabold text-[#d62e1f] mb-2">
                      {stats.clubsJoined}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-[#a0a0a0] font-semibold">Clubs Joined</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gamification Section */}
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Gamification <span className="text-[#d62e1f]">Progress</span>
                </h2>
                <GamificationCard userId={currentUser?.id} />
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Quick <span className="text-[#d62e1f]">Access</span>
                </h2>

                <div className="space-y-4">
                  <Link
                    to="/registrations"
                    className="flex items-center justify-between p-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all group shadow-lg hover:shadow-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#d62e1f] rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-calendar-check text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#d62e1f] transition-colors">
                          My Registrations
                        </h3>
                        <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">View and manage your event registrations</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-gray-600 dark:text-[#a0a0a0] group-hover:text-[#d62e1f] transition-colors" />
                  </Link>

                  <Link
                    to="/csi-dashboard"
                    className="flex items-center justify-between p-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#d62e1f] transition-all group shadow-lg hover:shadow-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-chart-pie text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#d62e1f] transition-colors">
                          CSI Statistics
                        </h3>
                        <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">View your CSI activity progress and statistics</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-gray-600 dark:text-[#a0a0a0] group-hover:text-[#d62e1f] transition-colors" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Interests Section */}
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                  My <span className="text-[#d62e1f]">Interests</span>
                </h2>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a] shadow-lg">
                  <EditInterestsSection />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-0">
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Saved <span className="text-[#d62e1f]">Events</span>
                </h2>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a] shadow-lg">
                  <SavedEventsTab />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                  <span className="text-[#d62e1f]">Settings</span>
                </h2>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] divide-y divide-gray-200 dark:divide-[#2a2a2a] shadow-lg">
                  {/* Language Setting */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <i className="fa-solid fa-language text-[#d62e1f] text-xl" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold">{t('profile.language')}</h3>
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">{t('profile.chooseLanguage')}</p>
                        </div>
                      </div>
                      <LanguageSelector />
                    </div>
                  </div>

                  {/* Notifications Setting */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <i className="fa-solid fa-bell text-[#d62e1f] text-xl" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold">Notifications</h3>
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">Manage notification preferences</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white rounded-lg transition-colors">
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <i className="fa-solid fa-shield-halved text-[#d62e1f] text-xl" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold">Privacy & Security</h3>
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">Control your privacy settings</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white rounded-lg transition-colors">
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>
                  </div>

                  {/* About & Help */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <i className="fa-solid fa-circle-info text-[#d62e1f] text-xl" />
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold">About & Help</h3>
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">Get help and learn about the app</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white rounded-lg transition-colors">
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="p-6">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <i className="fa-solid fa-right-from-bracket text-[#d62e1f] text-xl" />
                        <div className="text-left">
                          <h3 className="text-gray-900 dark:text-white font-semibold group-hover:text-[#d62e1f] transition-colors">Logout</h3>
                          <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">Sign out of your account</p>
                        </div>
                      </div>
                      <i className="fa-solid fa-chevron-right text-gray-600 dark:text-[#a0a0a0] group-hover:text-[#d62e1f] transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-student users - just show settings */
        <div className="py-8 px-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
              <span className="text-[#d62e1f]">Settings</span>
            </h2>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] divide-y divide-gray-200 dark:divide-[#2a2a2a] shadow-lg">
              {/* Language Setting */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-language text-[#d62e1f] text-xl" />
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{t('profile.language')}</h3>
                      <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">{t('profile.chooseLanguage')}</p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
              </div>

              {/* Logout */}
              <div className="p-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-right-from-bracket text-[#d62e1f] text-xl" />
                    <div className="text-left">
                      <h3 className="text-gray-900 dark:text-white font-semibold group-hover:text-[#d62e1f] transition-colors">Logout</h3>
                      <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">Sign out of your account</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-600 dark:text-[#a0a0a0] group-hover:text-[#d62e1f] transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 liquid-glass-overlay z-40"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white dark:bg-[#1a1a1a] w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-300">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-4 flex items-center justify-between transition-colors duration-300">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{t('profile.editProfile')}</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-600 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-2xl" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Avatar Upload */}
                <div>
                  <Label className="text-gray-900 dark:text-white transition-colors duration-300 mb-3 block">{t('profile.profilePicture')}</Label>
                  <div className="flex items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] ring-2 ring-gray-300 dark:ring-[#3a3a3a]">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={cn(
                          'w-full h-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-[#d62e1f] to-[#b91c1c]',
                          formData.avatar && 'hidden'
                        )}
                      >
                        {formData.firstName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white rounded-lg transition-colors">
                        <i className="fa-solid fa-camera" />
                        <span>{uploadingAvatar ? t('profile.uploading') : t('profile.uploadPhoto')}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-[#666666] mt-2">{t('profile.maxFileSize')}</p>
                    </div>
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-gray-900 dark:text-white transition-colors duration-300">
                    {t('profile.firstName')} <span className="text-[#d62e1f]">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-2 bg-gray-100 dark:bg-[#2a2a2a] border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] transition-colors duration-300"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-gray-900 dark:text-white transition-colors duration-300">
                    {t('profile.lastName')} <span className="text-[#d62e1f]">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-2 bg-gray-100 dark:bg-[#2a2a2a] border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] transition-colors duration-300"
                    required
                  />
                </div>

                {/* Faculty */}
                <div>
                  <Label htmlFor="faculty" className="text-gray-900 dark:text-white transition-colors duration-300">{t('profile.faculty')}</Label>
                  <Input
                    id="faculty"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="mt-2 bg-gray-100 dark:bg-[#2a2a2a] border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] transition-colors duration-300"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <Label className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.email')}</Label>
                  <Input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="mt-2 bg-gray-200 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#3a3a3a] text-gray-500 dark:text-[#a0a0a0] cursor-not-allowed transition-colors duration-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-[#666666] mt-1 transition-colors duration-300">{t('profile.emailReadOnly')}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2a2a2a] p-6 flex gap-3 transition-colors duration-300">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 liquid-glass-red-button text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {t('profile.saving')}
                    </>
                  ) : (
                    t('profile.saveChanges')
                  )}
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-300 dark:bg-[#2a2a2a] hover:bg-gray-400 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
