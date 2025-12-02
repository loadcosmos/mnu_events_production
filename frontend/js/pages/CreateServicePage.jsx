import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select.jsx';
import servicesService from '../services/servicesService';
import { toast } from 'sonner';

const CATEGORIES = [
    { value: 'DESIGN', label: 'Design' },
    { value: 'PHOTO_VIDEO', label: 'Photo/Video' },
    { value: 'IT', label: 'IT' },
    { value: 'COPYWRITING', label: 'Copywriting' },
    { value: 'CONSULTING', label: 'Consulting' },
    { value: 'OTHER', label: 'Other' },
];

const PRICE_TYPES = [
    { value: 'FIXED', label: 'Fixed Price' },
    { value: 'HOURLY', label: 'Hourly Rate' },
];

export default function CreateServicePage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        price: '',
        priceType: 'FIXED',
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

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return false;
        }
        if (formData.description.trim().length < 100) {
            setError('Description must be at least 100 characters long');
            return false;
        }
        if (!formData.category) {
            setError('Category is required');
            return false;
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            setError('Valid price is required');
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

            const serviceData = {
                type: 'GENERAL', // Default to GENERAL service type
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
                price: parseFloat(formData.price),
                priceType: formData.priceType,
                ...(formData.imageUrl.trim() && { imageUrl: formData.imageUrl.trim() }),
            };

            await servicesService.create(serviceData);

            toast.success('Service created successfully!', {
                description: 'Your service is now visible in the marketplace.',
            });

            navigate('/');
        } catch (err) {
            console.error('[CreateServicePage] Create service failed:', err);
            const errorMessage = err.response?.data?.message
                ? (Array.isArray(err.response.data.message)
                    ? err.response.data.message.join(', ')
                    : err.response.data.message)
                : err.message || 'Failed to create service';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Create New Service</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Offer your skills to the community
                </p>
            </div>

            <Card className="liquid-glass-card rounded-2xl">
                <CardHeader className="border-b border-gray-200 dark:border-[#2a2a2a]">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                        Service Details
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">Enter information about your service</CardDescription>
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
                                placeholder="e.g., Professional Logo Design"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="description" className="dark:text-white">Description *</Label>
                                <span className={`text-xs ${formData.description.trim().length >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {formData.description.trim().length} / 100 characters minimum
                                </span>
                            </div>
                            <Textarea
                                id="description"
                                placeholder="Describe what you offer in detail (minimum 100 characters)..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={5}
                                required
                                className="rounded-xl"
                            />
                            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                <i className="fa-solid fa-info-circle mt-0.5"></i>
                                <span><strong>Required:</strong> Include contact information (WhatsApp, Telegram, or phone number) in your description</span>
                            </p>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category" className="dark:text-white">Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => handleChange('category', value)}
                                required
                            >
                                <SelectTrigger id="category" className="rounded-xl">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="dark:text-white">Price (KZT) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 5000"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priceType" className="dark:text-white">Price Type *</Label>
                                <Select
                                    value={formData.priceType}
                                    onValueChange={(value) => handleChange('priceType', value)}
                                    required
                                >
                                    <SelectTrigger id="priceType" className="rounded-xl">
                                        <SelectValue placeholder="Select price type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRICE_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="dark:text-white">Image URL (optional)</Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={formData.imageUrl}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
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
                                {loading ? 'Creating...' : 'Create Service'}
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
