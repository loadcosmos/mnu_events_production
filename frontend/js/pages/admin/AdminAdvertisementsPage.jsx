import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select.jsx';
import adsService from '../../services/adsService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next'; // Added import
import {
    Megaphone,
    Plus,
    Trash2,
    Eye,
    MousePointer,
    CheckCircle,
    Clock,
    Image,
    Link,
    Calendar,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';

const AD_POSITIONS = [
    { value: 'TOP_BANNER', label: 'Top Banner', price: '10,000 ₸/week' },
    { value: 'NATIVE_FEED', label: 'Native Feed', price: '8,000 ₸/week' },
    { value: 'BOTTOM_BANNER', label: 'Bottom Banner', price: '5,000 ₸/week' },
    { value: 'HERO_SLIDE', label: 'Hero Slide', price: '12,000 ₸/week' },
    { value: 'SIDEBAR', label: 'Sidebar', price: '6,000 ₸/week' },
];

const navigate = useNavigate();
const { user, isAuthenticated } = useAuth();
const { t } = useTranslation();

const [ads, setAds] = useState([]);
const [loading, setLoading] = useState(true);
const [showCreateForm, setShowCreateForm] = useState(false);
const [creating, setCreating] = useState(false);

// Form state
const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    imageUrl: '',
    linkUrl: '',
    position: 'TOP_BANNER',
    duration: 1,
});

useEffect(() => {
    if (!isAuthenticated()) {
        navigate('/login');
        return;
    }

    if (user?.role !== 'ADMIN') {
        toast.error('This page is only accessible to administrators');
        navigate('/');
        return;
    }

    loadAds();
}, [isAuthenticated, user, navigate]);

const loadAds = async () => {
    try {
        setLoading(true);
        const data = await adsService.getAll();
        setAds(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error('Failed to load advertisements:', err);
        // If endpoint doesn't exist yet, show empty state
        setAds([]);
    } finally {
        setLoading(false);
    }
};

const handleCreateAd = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
    }
    if (!formData.imageUrl.trim()) {
        toast.error('Image URL is required');
        return;
    }

    try {
        setCreating(true);
        await adsService.create({
            ...formData,
            duration: parseInt(formData.duration, 10),
        });
        toast.success('Advertisement created successfully!');
        setShowCreateForm(false);
        setFormData({
            title: '',
            companyName: '',
            imageUrl: '',
            linkUrl: '',
            position: 'TOP_BANNER',
            duration: 1,
        });
        await loadAds();
    } catch (err) {
        console.error('Failed to create ad:', err);
        toast.error(err.response?.data?.message || 'Failed to create advertisement');
    } finally {
        setCreating(false);
    }
};

const handleToggleActive = async (adId, currentStatus) => {
    try {
        await adsService.updatePaymentStatus(adId, currentStatus ? 'PENDING' : 'PAID');
        toast.success(currentStatus ? 'Advertisement deactivated' : 'Advertisement activated');
        await loadAds();
    } catch (err) {
        toast.error('Failed to update advertisement status');
    }
};

const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) {
        return;
    }

    try {
        await adsService.delete(adId);
        toast.success('Advertisement deleted');
        await loadAds();
    } catch (err) {
        toast.error('Failed to delete advertisement');
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getPositionLabel = (position) => {
    return AD_POSITIONS.find(p => p.value === position)?.label || position;
};

if (loading) {
    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-white/5 rounded w-1/3"></div>
                <div className="h-64 bg-white/5 rounded"></div>
            </div>
        </div>
    );
}

return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                    <Megaphone className="w-6 h-6 md:w-8 md:h-8 text-[#d62e1f]" />
                    {t('admin.advertisements')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('admin.manageAds')}
                </p>
            </div>
            <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
                className="liquid-glass-red-button text-white w-full sm:w-auto"
            >
                <Plus className="w-4 h-4 mr-2" />
                {showCreateForm ? t('common.cancel') : t('admin.createAd')}
            </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
            <Card className="border-[#d62e1f]/30 bg-white dark:bg-[#1a1a1a]">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">{t('admin.createNewAd')}</CardTitle>
                    <CardDescription>{t('admin.fillAdDetails')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateAd} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">{t('admin.adTitle')} *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Winter Sale Promotion"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="text-gray-700 dark:text-gray-300">{t('partner.companyName')}</Label>
                                <Input
                                    id="companyName"
                                    placeholder="e.g., Coffee House LLP"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="position" className="text-gray-700 dark:text-gray-300">{t('admin.adPosition')} *</Label>
                                <Select
                                    value={formData.position}
                                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AD_POSITIONS.map((pos) => (
                                            <SelectItem key={pos.value} value={pos.value}>
                                                {pos.label} ({pos.price})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-gray-700 dark:text-gray-300">Image URL *</Label>
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    placeholder="https://example.com/banner.jpg"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkUrl" className="text-gray-700 dark:text-gray-300">Link URL (optional)</Label>
                                <Input
                                    id="linkUrl"
                                    type="url"
                                    placeholder="https://example.com/landing-page"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-gray-700 dark:text-gray-300">Duration (weeks) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={creating}
                                className="liquid-glass-red-button text-white"
                            >
                                {creating ? t('common.loading') : t('admin.createAd')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateForm(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* Stats Overview */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                <CardHeader className="pb-2 px-3 pt-3">
                    <CardDescription className="text-xs">{t('admin.totalAds')}</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{ads.length}</div>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                <CardHeader className="pb-2 px-3 pt-3">
                    <CardDescription className="text-xs">{t('admin.activeAds')}</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                    <div className="text-xl md:text-2xl font-bold text-green-500">
                        {ads.filter((a) => a.isActive && a.paymentStatus === 'PAID').length}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                <CardHeader className="pb-2 px-3 pt-3">
                    <CardDescription className="text-xs">{t('admin.impressions')}</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                    <div className="text-lg md:text-2xl font-bold text-blue-500 truncate">
                        {ads.reduce((sum, a) => sum + (a.impressions || 0), 0).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                <CardHeader className="pb-2 px-3 pt-3">
                    <CardDescription className="text-xs">{t('admin.clicks')}</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                    <div className="text-lg md:text-2xl font-bold text-purple-500">
                        {ads.reduce((sum, a) => sum + (a.clicks || 0), 0).toLocaleString()}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Ads List */}
        <div className="space-y-4">
            {ads.length === 0 ? (
                <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <CardContent className="py-12">
                        <div className="text-center space-y-3">
                            <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto opacity-50" />
                            <p className="text-xl font-medium text-gray-900 dark:text-white">{t('admin.noAds')}</p>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('admin.startCreatingAds')}
                            </p>
                            <Button
                                onClick={() => setShowCreateForm(true)}
                                className="mt-4 liquid-glass-red-button text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('admin.createAd')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                ads.map((ad) => (
                    <Card
                        key={ad.id}
                        className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#d62e1f]/30 transition-all"
                    >
                        <CardContent className="py-4">
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                {/* Ad Image Preview */}
                                <div className="w-full sm:w-32 h-28 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                    <img
                                        src={ad.imageUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/images/placeholder.jpg';
                                        }}
                                    />
                                </div>

                                {/* Ad Details */}
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                                            {ad.title}
                                        </h3>
                                        {ad.companyName && (
                                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                by {ad.companyName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge
                                            variant="outline"
                                            className={ad.isActive && ad.paymentStatus === 'PAID'
                                                ? 'bg-green-500/10 border-green-500/20 text-green-500 text-xs'
                                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 text-xs'
                                            }
                                        >
                                            {ad.isActive && ad.paymentStatus === 'PAID' ? (
                                                <><CheckCircle className="w-3 h-3 mr-1" /> {t('common.active')}</>
                                            ) : (
                                                <><Clock className="w-3 h-3 mr-1" /> {t('common.inactive')}</>
                                            )}
                                        </Badge>
                                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-500 text-xs">
                                            {getPositionLabel(ad.position)}
                                        </Badge>
                                    </div>

                                    <div className="grid gap-1 sm:gap-2 grid-cols-2 md:grid-cols-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="truncate">{formatDate(ad.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span>{(ad.impressions || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span>{(ad.clicks || 0).toLocaleString()}</span>
                                        </div>
                                        {ad.linkUrl && (
                                            <div className="flex items-center gap-1 truncate col-span-2 md:col-span-1">
                                                <Link className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <a
                                                    href={ad.linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline truncate"
                                                >
                                                    Link
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(ad.id, ad.isActive && ad.paymentStatus === 'PAID')}
                                        className={`flex-1 sm:flex-none ${ad.isActive && ad.paymentStatus === 'PAID'
                                            ? 'text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10'
                                            : 'text-green-500 border-green-500/30 hover:bg-green-500/10'
                                            }`}
                                    >
                                        {ad.isActive && ad.paymentStatus === 'PAID' ? (
                                            <><ToggleRight className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Off</span></>
                                        ) : (
                                            <><ToggleLeft className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">On</span></>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(ad.id)}
                                        className="flex-1 sm:flex-none text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    </div>
);
}
