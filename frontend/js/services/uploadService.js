import { api } from './apiClient.js';

/**
 * Upload Service
 * Centralized service for image uploads with Cloudinary
 */
const uploadService = {
    /**
     * Upload event banner image
     * @param {string} eventId - Event ID
     * @param {File} file - Image file
     * @returns {Promise<{imageUrl: string, publicId: string}>}
     */
    async uploadEventImage(eventId, file) {
        const formData = new FormData();
        formData.append('image', file);
        return api.post(`/upload/event/${eventId}`, formData, { timeout: 60000 });
    },

    /**
     * Upload service image
     * @param {string} serviceId - Service ID
     * @param {File} file - Image file
     * @returns {Promise<{imageUrl: string, publicId: string}>}
     */
    async uploadServiceImage(serviceId, file) {
        const formData = new FormData();
        formData.append('image', file);
        return api.post(`/upload/service/${serviceId}`, formData, { timeout: 60000 });
    },

    /**
     * Upload club logo/image
     * @param {string} clubId - Club ID
     * @param {File} file - Image file
     * @returns {Promise<{imageUrl: string, publicId: string}>}
     */
    async uploadClubImage(clubId, file) {
        const formData = new FormData();
        formData.append('image', file);
        return api.post(`/upload/club/${clubId}`, formData, { timeout: 60000 });
    },

    /**
     * Upload generic image (returns URL to use anywhere)
     * @param {File} file - Image file
     * @returns {Promise<{imageUrl: string, publicId: string}>}
     */
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/upload/image', formData, { timeout: 60000 });
    },
};

export default uploadService;
