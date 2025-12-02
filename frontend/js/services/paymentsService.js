import { api } from './apiClient.js';

const paymentsService = {
  /**
   * Create a payment for an event
   * @param {string} eventId - Event ID
   * @param {number} amount - Payment amount
   * @returns {Promise} Payment response with transaction ID and payment URL
   */
  createPayment: async (data) => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  /**
   * Confirm payment via webhook (mock)
   * @param {string} transactionId - Transaction ID
   * @param {string} status - Payment status (success/failed/declined)
   * @returns {Promise} Confirmation response
   */
  confirmPayment: async (transactionId, status = 'success') => {
    const response = await api.post('/payments/webhook', { transactionId, status });
    return response;
  },

  /**
   * Get all tickets for the current user
   * @returns {Promise} List of tickets
   */
  getMyTickets: async () => {
    const response = await api.get('/payments/my-tickets');
    return response;
  },

  /**
   * Get a specific ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Ticket details
   */
  getTicketById: async (ticketId) => {
    const response = await api.get(`/payments/ticket/${ticketId}`);
    return response;
  },

  /**
   * Request a refund for a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Refund response
   */
  refundTicket: async (ticketId) => {
    const response = await api.post(`/payments/refund/${ticketId}`);
    return response;
  },

  /**
   * Get transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise} Transaction details
   */
  getTransactionStatus: async (transactionId) => {
    const response = await api.get(`/payments/transaction/${transactionId}`);
    return response;
  },

  /**
   * Confirm mock payment
   * @param {string} transactionId - Transaction ID
   * @returns {Promise} Confirmation response
   */
  confirmMockPayment: async (transactionId) => {
    const response = await api.post(`/payments/mock-confirm/${transactionId}`);
    return response.data;
  },
};

export default paymentsService;
