import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Star,
    MapPin,
    Mail,
    Phone,
    ArrowLeft,
    Grid,
    Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import servicesService from '../../services/servicesService';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function ProviderProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProviderData();
    }, [id]);

    const loadProviderData = async () => {
        try {
            setLoading(true);
            // Fetch services by provider. The first service will contain the provider details.
            const response = await servicesService.getByProvider(id);
            setServices(response);

            if (response && response.length > 0) {
                setProvider(response[0].provider);
            } else {
                // TODO: Need a dedicated endpoint to fetch user details if they have no services
                // For now, if no services, we might not get provider info easily without a dedicated endpoint
            }
        } catch (error) {
            console.error('Error loading provider:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageRating = () => {
        if (!services.length) return 0;
        const totalRating = services.reduce((acc, s) => acc + (s.rating || 0), 0);
        return (totalRating / services.length).toFixed(1);
    };

    const totalReviews = services.reduce((acc, s) => acc + (s.reviewCount || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider not found</h2>
                <p className="text-gray-600 mb-4">This user hasn't listed any active services.</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pb-12">
            {/* Header / Cover */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 h-48 md:h-64 relative">
                <div className="absolute top-4 left-4">
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200">
                                <img
                                    src={provider.avatar || '/images/default-avatar.png'}
                                    alt={provider.firstName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2 md:pt-12">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {provider.firstName} {provider.lastName}
                            </h1>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {provider.faculty && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {provider.faculty}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">{calculateAverageRating()}</span>
                                    <span>({totalReviews} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Grid className="w-4 h-4" />
                                    <span>{services.length} Services</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => window.location.href = `mailto:${provider.email}`}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Contact Provider
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Services</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <Card
                                key={service.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border-none shadow-md"
                                onClick={() => navigate(`/services/${service.id}`)}
                            >
                                <div className="h-48 overflow-hidden bg-gray-100 relative">
                                    <img
                                        src={service.imageUrl || '/images/placeholder.jpg'}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white">
                                        {service.type}
                                    </Badge>
                                </div>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{service.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.category}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="font-bold text-red-600 text-lg">
                                            {service.price} ₸
                                            <span className="text-xs text-gray-400 font-normal ml-1">
                                                /{service.priceType === 'HOURLY' ? 'hr' : 'fix'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            {service.rating || 'New'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
