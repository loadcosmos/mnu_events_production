import { test, expect } from '@playwright/test';

test.describe('Logout Endpoint E2E', () => {
  test('should successfully logout authenticated user', async ({ request }) => {
    // First, login to get a token
    const loginResponse = await request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'admin@kazguu.kz',
        password: 'Password123!',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.accessToken;

    expect(token).toBeDefined();

    // Now test logout endpoint
    const logoutResponse = await request.post('http://localhost:3001/api/auth/logout', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(logoutResponse.ok()).toBeTruthy();
    const logoutData = await logoutResponse.json();
    expect(logoutData).toHaveProperty('message');
    expect(logoutData.message).toBe('Logged out successfully');
  });

  test('should return 401 when logout without token', async ({ request }) => {
    const logoutResponse = await request.post('http://localhost:3001/api/auth/logout');

    expect(logoutResponse.status()).toBe(401);
  });

  test('should return 401 when logout with invalid token', async ({ request }) => {
    const logoutResponse = await request.post('http://localhost:3001/api/auth/logout', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(logoutResponse.status()).toBe(401);
  });
});

