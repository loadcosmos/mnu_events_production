import { api } from './apiClient.js';

const paymentVerificationService = {
  /**
   * Upload receipt for payment verification
   * Student uploads screenshot of Kaspi transfer
   * @param {string} ticketId - Ticket ID
   * @param {string} receiptImageUrl - URL to receipt image
   * @returns {Promise} Verification response
   */
  uploadReceipt: async (ticketId, receiptImageUrl) => {
    const response = await api.post('/payment-verification/upload', {
      ticketId,
      receiptImageUrl,
    });
    return response;
  },

  /**
   * Get pending verifications for organizer's events
   * @param {string} eventId - Optional event ID filter
   * @returns {Promise} List of pending verifications
   */
  getPendingVerifications: async (eventId = null) => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/payment-verification/pending', { params });
    return response;
  },

  /**
   * Get all verifications for a specific event (organizer only)
   * @param {string} eventId - Event ID
   * @returns {Promise} List of verifications
   */
  getEventVerifications: async (eventId) => {
    const response = await api.get(`/payment-verification/event/${eventId}`);
    return response;
  },

  /**
   * Approve or reject payment verification
   * Organizer verifies the receipt and approves/rejects payment
   * @param {string} verificationId - Verification ID
   * @param {string} status - APPROVED or REJECTED
   * @param {string} organizerNotes - Optional notes (required for rejection)
   * @returns {Promise} Updated verification
   */
  verifyPayment: async (verificationId, status, organizerNotes = null) => {
    const response = await api.patch(`/payment-verification/${verificationId}/verify`, {
      status,
      organizerNotes,
    });
    return response;
  },

  /**
   * Get verification by ID
   * @param {string} id - Verification ID
   * @returns {Promise} Verification details
   */
  findOne: async (id) => {
    const response = await api.get(`/payment-verification/${id}`);
    return response;
  },

  /**
   * Get student's payment verifications
   * @returns {Promise} List of student's verifications
   */
  getMyVerifications: async () => {
    const response = await api.get('/payment-verification/my');
    return response;
  },
};

export default paymentVerificationService;
