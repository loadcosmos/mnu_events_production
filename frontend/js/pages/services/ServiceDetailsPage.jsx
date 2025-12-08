import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  User,
  DollarSign,
  Clock,
  Mail,
  ArrowLeft,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

import servicesService from '../../services/servicesService';
import { sanitizeText } from '../../utils/sanitize';

const priceTypeLabels = {
  HOURLY: 'per hour',
  FIXED: 'fixed price',
  PER_SESSION: 'per session',
};

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await servicesService.getById(id);
      setService(response);
    } catch (error) {
      console.error('Error loading service:', error);
      // If 404 or other error, service will be null and "Service not found" will be shown
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (service?.provider?.email) {
      window.location.href = `mailto:${service.provider.email}?subject=Service Order: ${service.title}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            Service not found
          </h2>
          <Button onClick={() => navigate('/marketplace')} variant="outline">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <img
                src={service.imageUrl || '/images/event-placeholder.jpg'}
                alt={service.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src = '/images/event-placeholder.jpg';
                }}
              />
            </div>

            {/* Service Info */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                    {service.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                    <span className="px-3 py-1 rounded-full bg-[#d62e1f]/10 dark:bg-[#d62e1f]/20 text-[#d62e1f]">
                      {service.category}
                    </span>
                    <span>
                      {service.type === 'TUTORING' ? 'Tutoring' : 'Service'}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      {(service.rating || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#666666] transition-colors duration-300">
                      {service.reviewCount || 0} reviews
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-[#a0a0a0] whitespace-pre-line transition-colors duration-300">
                  {sanitizeText(service.description)}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                Reviews ({service.reviewCount || 0})
              </h2>

              <div className="space-y-6">
                {service.reviews && service.reviews.length > 0 ? (
                  service.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 dark:border-[#2a2a2a] last:border-0 pb-6 last:pb-0 transition-colors duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d62e1f] to-[#b91c1c] flex items-center justify-center text-white font-semibold">
                            {review.author?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                              {review.author || 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#666666] transition-colors duration-300">
                              {new Date(review.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-[#2a2a2a]'
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-[#a0a0a0] transition-colors duration-300">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-[#666666] transition-colors duration-300">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] sticky top-24 transition-colors duration-300">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-[#d62e1f]">
                    {(service.price || 0).toLocaleString()}₸
                  </span>
                  <span className="text-gray-500 dark:text-[#666666] transition-colors duration-300">
                    {priceTypeLabels[service.priceType] || 'per hour'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <Button onClick={handleContact} className="w-full liquid-glass-red-button text-white" size="lg">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a0a0a0] bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3 transition-colors duration-300">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Safe transaction</span>
              </div>
            </div>

            {/* Provider Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                Provider
              </h3>

              <div className="flex items-center gap-4 mb-4">
                {service.provider?.avatar ? (
                  <img
                    src={service.provider.avatar}
                    alt={`${service.provider.firstName} ${service.provider.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d62e1f] to-[#b91c1c] flex items-center justify-center text-white text-xl font-bold">
                    {service.provider?.firstName?.charAt(0) || 'U'}
                    {service.provider?.lastName?.charAt(0) || ''}
                  </div>
                )}

                <div>
                  <div className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                    {service.provider?.firstName || 'Unknown'} {service.provider?.lastName || ''}
                  </div>
                  {service.provider?.faculty && (
                    <div className="text-sm text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
                      {service.provider.faculty}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => service.provider?.id && navigate(`/services/provider/${service.provider.id}`)}
                variant="outline"
                className="w-full border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Provider Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
