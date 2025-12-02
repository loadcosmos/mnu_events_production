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
import { Button } from '../components/ui/button';

import servicesService from '../services/servicesService';

const priceTypeLabels = {
  HOURLY: 'за час',
  FIXED: 'фиксированная цена',
  PER_SESSION: 'за занятие',
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
      window.location.href = `mailto:${service.provider.email}?subject=Заказ услуги: ${service.title}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Услуга не найдена
          </h2>
          <Button onClick={() => navigate('/services')} variant="outline">
            Вернуться к услугам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={service.imageUrl}
                alt={service.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Service Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {service.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      {service.category}
                    </span>
                    <span>
                      {service.type === 'TUTORING' ? 'Репетиторство' : 'Услуга'}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(service.rating || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {service.reviewCount || 0} отзывов
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {service.description}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Отзывы ({service.reviewCount || 0})
              </h2>

              <div className="space-y-6">
                {service.reviews && service.reviews.length > 0 ? (
                  service.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {review.author}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(review.date).toLocaleDateString('ru-RU', {
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
                                : 'text-gray-300 dark:text-gray-600'
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Пока нет отзывов</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {service.price.toLocaleString()}₸
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {priceTypeLabels[service.priceType]}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <Button onClick={handleContact} className="w-full" size="lg">
                  <Mail className="w-5 h-5 mr-2" />
                  Связаться
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Безопасная сделка</span>
              </div>
            </div>

            {/* Provider Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Исполнитель
              </h3>

              <div className="flex items-center gap-4 mb-4">
                {service.provider.avatar ? (
                  <img
                    src={service.provider.avatar}
                    alt={`${service.provider.firstName} ${service.provider.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    {service.provider.firstName.charAt(0)}
                    {service.provider.lastName.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {service.provider.firstName} {service.provider.lastName}
                  </div>
                  {service.provider.faculty && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {service.provider.faculty}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => navigate(`/services/provider/${service.provider.id}`)}
                variant="outline"
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Профиль исполнителя
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
