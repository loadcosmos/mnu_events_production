import { api } from './apiClient.js';

export const moderationService = {
    getQueue: async (status = 'PENDING', type) => {
        const params = { status };
        if (type) params.type = type;
        const response = await api.get('/moderation/queue', { params });
        return response;
    },

    getStats: async () => {
        const response = await api.get('/moderation/stats');
        return response;
    },

    approve: async (id) => {
        const response = await api.post(`/moderation/${id}/approve`);
        return response;
    },

    reject: async (id, reason) => {
        const response = await api.post(`/moderation/${id}/reject`, { reason });
        return response;
    }
};
