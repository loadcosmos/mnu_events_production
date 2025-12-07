/**
 * Central export point for all services
 * Usage: import { eventsService, authService, api } from '@services';
 */

// API Client
export { api, default as apiClient } from './apiClient.js';

// Core Services
export { default as authService } from './authService.js';
export { default as eventsService } from './eventsService.js';
export { default as clubsService } from './clubsService.js';
export { default as usersService } from './usersService.js';

// Feature Services
export { default as registrationsService } from './registrationsService.js';
export { default as paymentsService } from './paymentsService.js';
export { default as paymentVerificationService } from './paymentVerificationService.js';
export { default as checkinService } from './checkinService.js';

// Platform Services
export { default as adsService } from './adsService.js';
export { default as analyticsService } from './analyticsService.js';
export { default as gamificationService } from './gamificationService.js';
export { default as moderationService } from './moderationService.js';
export { default as partnersService } from './partnersService.js';
export { default as servicesService } from './servicesService.js';
export { default as settingsService } from './settingsService.js';

// Utilities
export { default as toastService } from './toastService.js';
