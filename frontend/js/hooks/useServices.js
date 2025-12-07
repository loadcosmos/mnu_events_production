/**
 * React Query hooks for Services API (Marketplace)
 * Provides caching, deduplication, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import servicesService from '../services/servicesService';

// Query keys for cache management
export const serviceKeys = {
    all: ['services'],
    lists: () => [...serviceKeys.all, 'list'],
    list: (filters) => [...serviceKeys.lists(), filters],
    details: () => [...serviceKeys.all, 'detail'],
    detail: (id) => [...serviceKeys.details(), id],
    myServices: () => [...serviceKeys.all, 'my-services'],
};

/**
 * Hook to fetch all services with filters
 * @param {Object} filters - Filter parameters
 * @param {Object} options - Additional React Query options
 */
export function useServices(filters = {}, options = {}) {
    return useQuery({
        queryKey: serviceKeys.list(filters),
        queryFn: async () => {
            const response = await servicesService.getAll(filters);
            return response?.data || response || [];
        },
        ...options,
    });
}

/**
 * Hook to fetch a single service by ID
 * @param {string} serviceId - Service ID
 * @param {Object} options - Additional React Query options
 */
export function useService(serviceId, options = {}) {
    return useQuery({
        queryKey: serviceKeys.detail(serviceId),
        queryFn: () => servicesService.getById(serviceId),
        enabled: !!serviceId,
        ...options,
    });
}

/**
 * Hook to fetch current user's services
 * @param {Object} options - Additional React Query options
 */
export function useMyServices(options = {}) {
    return useQuery({
        queryKey: serviceKeys.myServices(),
        queryFn: () => servicesService.getMyServices(),
        ...options,
    });
}

/**
 * Hook to create a new service
 */
export function useCreateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (serviceData) => servicesService.create(serviceData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: serviceKeys.myServices() });
        },
    });
}

/**
 * Hook to update a service
 */
export function useUpdateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ serviceId, data }) => servicesService.update(serviceId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) });
            queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
        },
    });
}

/**
 * Hook to delete a service
 */
export function useDeleteService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (serviceId) => servicesService.delete(serviceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.all });
        },
    });
}
