import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';
import eventsService from '../../services/eventsService';
import uploadService from '../../services/uploadService';
import { toast } from 'sonner';
import { getAllCsiCategories, getCsiIcon, getCsiColors } from '../../utils/categoryMappers';
import ImageUploadCrop from '../../components/ImageUploadCrop';

const CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'TECH', label: 'Tech' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'CAREER', label: 'Career' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    csiTags: [],
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    capacity: '',
    imageUrl: '',
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleCsiToggle = (csiValue) => {
    setFormData(prev => {
      const currentTags = prev.csiTags || [];
      const isSelected = currentTags.includes(csiValue);

      return {
        ...prev,
        csiTags: isSelected
          ? currentTags.filter(tag => tag !== csiValue)
          : [...currentTags, csiValue],
      };
    });
  };

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      // Upload as generic image first, then we'll update the event after creation
      const result = await uploadService.uploadImage(file);
      handleChange('imageUrl', result.imageUrl);
      toast.success(t('events.messages.imageUploaded'), {
        description: t('events.messages.bannerUploaded'),
      });
    } catch (err) {
      console.error('[CreateEventPage] Image upload failed:', err);
      toast.error(t('events.messages.uploadFailed'), {
        description: err.message || t('events.messages.uploadFailed'),
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError(t('events.validation.titleRequired'));
      return false;
    }
    if (!formData.description.trim()) {
      setError(t('events.validation.descRequired'));
      return false;
    }
    if (!formData.category) {
      setError(t('events.validation.categoryRequired'));
      return false;
    }
    if (!formData.location.trim()) {
      setError(t('events.validation.locationRequired'));
      return false;
    }
    if (!formData.startDate || !formData.startTime) {
      setError(t('events.validation.startDateTimeRequired'));
      return false;
    }
    if (!formData.endDate || !formData.endTime) {
      setError(t('events.validation.endDateTimeRequired'));
      return false;
    }
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      setError(t('events.validation.capacityMin'));
      return false;
    }

    // Validate dates
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    if (startDateTime >= endDateTime) {
      setError(t('events.validation.endDateAfterStart'));
      return false;
    }
    if (startDateTime < now) {
      setError(t('events.validation.startDatePast'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Combine date and time into ISO strings
      const startDate = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const endDate = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        csiTags: formData.csiTags,
        location: formData.location.trim(),
        startDate,
        endDate,
        capacity: parseInt(formData.capacity),
        ...(formData.imageUrl.trim() && { imageUrl: formData.imageUrl.trim() }),
      };

      const response = await eventsService.create(eventData);
      const eventId = response.id || response.data?.id;
      const eventStatus = response.status || response.data?.status;

      // Show different messages based on user role and event status
      if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
        toast.success(t('events.messages.createdSuccess'), {
          description: t('events.messages.visibleToStudents'),
        });
      } else if (eventStatus === 'PENDING_MODERATION') {
        toast.success(t('events.messages.createdPending'), {
          description: t('events.messages.awaitingApproval'),
        });
      } else {
        toast.success(t('events.messages.createdSuccess'), {
          description: t('events.messages.visibleToStudents'),
        });
      }

      // Redirect based on user role - organizers go back to their dashboard
      if (user?.role === 'ORGANIZER') {
        navigate('/organizer', { state: { scrollToEvents: true } });
      } else if (user?.role === 'EXTERNAL_PARTNER') {
        navigate('/partner', { state: { scrollToEvents: true } });
      } else if (eventId) {
        // Admin/Moderator/others - show the created event
        navigate(`/events/${eventId}`);
      } else {
        navigate('/events');
      }
    } catch (err) {
      console.error('[CreateEventPage] Create event failed:', err);
      const errorMessage = err.response?.data?.message
        ? (Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message)
        : err.message || t('events.messages.createFailed');
      setError(errorMessage);
      // Toast уже показывается в apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">{t('events.create')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('events.createSubtitle')}
        </p>
      </div>

      <Card className="liquid-glass-card rounded-2xl">
        <CardHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            {t('events.details')}
          </CardTitle>
          <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">{t('events.enterDetails')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-white">{t('events.form.title')} *</Label>
              <Input
                id="title"
                type="text"
                placeholder={t('events.placeholders.title')}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-white">{t('events.form.description')} *</Label>
              <Textarea
                id="description"
                placeholder={t('events.placeholders.description')}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={5}
                required
                className="rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="dark:text-white">{t('events.form.category')} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                required
              >
                <SelectTrigger id="category" className="rounded-xl">
                  <SelectValue placeholder={t('events.form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {t(`enums.category.${cat.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CSI Tags */}
            <div className="space-y-2">
              <Label className="dark:text-white">{t('events.form.csiTags')}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('events.form.csiHint')}
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                {getAllCsiCategories().map((csi) => {
                  const isSelected = formData.csiTags.includes(csi.value);
                  const colors = getCsiColors(csi.value);

                  return (
                    <button
                      key={csi.value}
                      type="button"
                      onClick={() => handleCsiToggle(csi.value)}
                      className={`
                        px-4 py-2 rounded-xl border-2 transition-all
                        ${isSelected
                          ? `${colors.bg} ${colors.border} ${colors.text} scale-105`
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }
                      `}
                    >
                      <span className="mr-2">{getCsiIcon(csi.value)}</span>
                      {t(`enums.csiCategory.${csi.value}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="dark:text-white">{t('events.form.location')} *</Label>
              <Input
                id="location"
                type="text"
                placeholder={t('events.placeholders.location')}
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="dark:text-white">{t('events.form.startDate')} *</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime" className="dark:text-white">{t('events.form.startTime')} *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate" className="dark:text-white">{t('events.form.endDate')} *</Label>
                <Input
                  id="endDate"
                  type="date"
                  min={formData.startDate || today}
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="dark:text-white">{t('events.form.endTime')} *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity" className="dark:text-white">{t('events.form.capacity')} *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder={t('events.placeholders.capacity')}
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            {/* Event Banner Image */}
            <div className="space-y-2">
              <ImageUploadCrop
                currentImage={formData.imageUrl}
                onUpload={handleImageUpload}
                shape="banner"
                aspectRatio={16 / 9}
                maxSizeMB={10}
                label={t('events.form.banner')}
                loading={uploadingImage}
                disabled={loading}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="flex-1 liquid-glass-red-button text-white rounded-2xl"
              >
                {loading ? t('events.buttons.creating') : t('events.buttons.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  if (user?.role === 'EXTERNAL_PARTNER') {
                    navigate('/partner');
                  } else {
                    navigate('/organizer');
                  }
                }}
                disabled={loading}
                className="border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
              >
                {t('events.buttons.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

