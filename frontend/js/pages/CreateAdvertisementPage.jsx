import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select.jsx';
import adsService from '../services/adsService';
import { toast } from 'sonner';

const POSITIONS = [
    { value: 'TOP_BANNER', label: 'Top Banner' },
    { value: 'HERO_SLIDE', label: 'Hero Slide' },
    { value: 'NATIVE_FEED', label: 'Native Feed' },
    { value: 'BOTTOM_BANNER', label: 'Bottom Banner' },
    { value: 'SIDEBAR', label: 'Sidebar' },
];

export default function CreateAdvertisementPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        linkUrl: '',
        position: 'NATIVE_FEED',
        duration: 1,
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

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!formData.imageUrl.trim()) {
            setError('Image URL is required');
            return false;
        }
        if (!formData.position) {
            setError('Position is required');
            return false;
        }
        if (!formData.duration || parseInt(formData.duration) < 1) {
            setError('Duration must be at least 1 week');
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

            const adData = {
                title: formData.title.trim(),
                imageUrl: formData.imageUrl.trim(),
                ...(formData.linkUrl.trim() && { linkUrl: formData.linkUrl.trim() }),
                position: formData.position,
                duration: parseInt(formData.duration),
            };

            await adsService.create(adData);

            toast.success('Advertisement created successfully!', {
                description: 'Your ad has been submitted for review.',
            });

            navigate('/'); // Redirect to home page
        } catch (err) {
            console.error('[CreateAdvertisementPage] Create ad failed:', err);
            const errorMessage = err.response?.data?.message
                ? (Array.isArray(err.response.data.message)
                    ? err.response.data.message.join(', ')
                    : err.response.data.message)
                : err.message || 'Failed to create advertisement';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Post Advertisement</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Promote your event or service
                </p>
            </div>

            <Card className="liquid-glass-card rounded-2xl">
                <CardHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                        Advertisement Details
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">Enter information about your advertisement</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="dark:text-white">Title *</Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="e.g., Student Discount at Coffee Shop"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="dark:text-white">Advertisement Image URL *</Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                placeholder="https://example.com/ad-image.jpg"
                                value={formData.imageUrl}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                required
                                className="rounded-xl"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">URL of the image to display in your advertisement</p>
                        </div>

                        {/* Link URL */}
                        <div className="space-y-2">
                            <Label htmlFor="linkUrl" className="dark:text-white">Target Link URL (Optional)</Label>
                            <Input
                                id="linkUrl"
                                type="url"
                                placeholder="https://coffeeshop.com/student-discount"
                                value={formData.linkUrl}
                                onChange={(e) => handleChange('linkUrl', e.target.value)}
                                className="rounded-xl"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Where users will be directed when clicking your advertisement</p>
                        </div>

                        {/* Position */}
                        <div className="space-y-2">
                            <Label htmlFor="position" className="dark:text-white">Position *</Label>
                            <Select
                                value={formData.position}
                                onValueChange={(value) => handleChange('position', value)}
                                required
                            >
                                <SelectTrigger id="position" className="rounded-xl">
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSITIONS.map((pos) => (
                                        <SelectItem key={pos.value} value={pos.value}>
                                            {pos.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="dark:text-white">Duration (Weeks) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                value={formData.duration}
                                onChange={(e) => handleChange('duration', e.target.value)}
                                required
                                className="rounded-xl"
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
                                {loading ? 'Creating...' : 'Create Advertisement'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/')}
                                disabled={loading}
                                className="border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
