import React, { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';
import { extractErrorMessage } from '../utils';

const PricingSettingsPage = () => {
  const [pricing, setPricing] = useState({
    basePrice: 5000,
    premiumPrice: 10000,
    packagePrice: 20000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPricing();
  }, []);

  // Auto-clear success message after 3 seconds with cleanup
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(''), 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getPricing();
      if (data) {
        setPricing({
          basePrice: Number(data.basePrice || 0),
          premiumPrice: Number(data.premiumPrice || 0),
          packagePrice: Number(data.packagePrice || 0),
        });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPricing((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      await settingsService.updatePricing(pricing);
      setSuccess('Тарифы успешно обновлены!');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Управление Тарифами
          </h1>
          <p className="text-gray-300">
            Настройка цен для внешних заведений
          </p>
        </div>

        {/* Pricing Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Base Price */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Базовое размещение
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="basePrice"
                  value={pricing.basePrice}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  тг
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Стандартное размещение мероприятия
              </p>
            </div>

            {/* Premium Price */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Премиум размещение
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="premiumPrice"
                  value={pricing.premiumPrice}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  тг
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Размещение с приоритетом в выдаче
              </p>
            </div>

            {/* Package Price */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Пакет (5 мероприятий)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="packagePrice"
                  value={pricing.packagePrice}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  тг
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Выгодный пакет на 5 мероприятий
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                <p className="text-green-200">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>

          {/* Pricing Summary */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <h3 className="text-white font-semibold mb-4">
              Сводка по тарифам
            </h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Базовое размещение:</span>
                <span className="font-semibold">{pricing.basePrice.toLocaleString()} тг</span>
              </div>
              <div className="flex justify-between">
                <span>Премиум размещение:</span>
                <span className="font-semibold">{pricing.premiumPrice.toLocaleString()} тг</span>
              </div>
              <div className="flex justify-between">
                <span>Пакет (5 мероприятий):</span>
                <span className="font-semibold">{pricing.packagePrice.toLocaleString()} тг</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span>Скидка при пакете:</span>
                <span className="font-semibold text-green-400">
                  {((1 - pricing.packagePrice / (pricing.basePrice * 5)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSettingsPage;
