import { api } from './apiClient.js';

class SettingsService {
  /**
   * Get current event pricing
   */
  async getPricing() {
    const response = await api.get('/settings/pricing');
    return response;
  }

  /**
   * Update event pricing (admin only)
   */
  async updatePricing(pricingData) {
    const response = await api.put('/settings/pricing', pricingData);
    return response;
  }

  /**
   * Get pricing history (admin only)
   */
  async getPricingHistory() {
    const response = await api.get('/settings/pricing/history');
    return response;
  }
}

export default new SettingsService();
