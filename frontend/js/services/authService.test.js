import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './authService.js';
import { api } from './apiClient.js';

// Mock apiClient
vi.mock('./apiClient.js', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('login', () => {
    it('should call api.post with correct endpoint and credentials', async () => {
      const credentials = {
        email: 'test@kazguu.kz',
        password: 'Password123!',
      };
      const mockResponse = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@kazguu.kz' },
      };

      api.post.mockResolvedValue(mockResponse);
      localStorageMock.setItem.mockImplementation(() => {});

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.user),
      );
    });

    it('should handle login errors', async () => {
      const credentials = {
        email: 'test@kazguu.kz',
        password: 'wrong',
      };
      const error = new Error('Invalid credentials');
      api.post.mockRejectedValue(error);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call api.post with /auth/logout endpoint', async () => {
      api.post.mockResolvedValue({ message: 'Logged out successfully' });
      localStorageMock.removeItem.mockImplementation(() => {});

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(api.clearAuthToken).toHaveBeenCalled();
    });

    it('should clear auth data even if logout request fails', async () => {
      api.post.mockRejectedValue(new Error('Network error'));
      localStorageMock.removeItem.mockImplementation(() => {});

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(api.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should call api.get with /auth/profile endpoint', async () => {
      const mockUser = { id: '1', email: 'test@kazguu.kz' };
      api.get.mockResolvedValue(mockUser);
      localStorageMock.setItem.mockImplementation(() => {});

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('should clear auth data if getCurrentUser fails', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));
      localStorageMock.removeItem.mockImplementation(() => {});

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(api.clearAuthToken).toHaveBeenCalled();
    });
  });
});

