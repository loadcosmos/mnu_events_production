import { test, expect } from '@playwright/test';

test.describe('Admin Login and Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login page
    await page.goto('http://localhost:5173/admin/login');
  });

  test('should display admin login form', async ({ page }) => {
    // Check that admin login form is visible
    await expect(page.getByText('Admin Login')).toBeVisible();
    await expect(page.getByText('Enter your admin credentials')).toBeVisible();
    await expect(page.getByPlaceholderText('admin@kazguu.kz')).toBeVisible();
    await expect(page.getByPlaceholderText('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In as Admin' })).toBeVisible();
  });

  test('should show error when credentials are invalid', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[name="email"]', 'wrong@kazguu.kz');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.getByText(/Login failed|Invalid credentials/i)).toBeVisible();
  });

  test('should redirect to admin dashboard on successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: {
            id: '1',
            email: 'admin@kazguu.kz',
            role: 'admin',
          },
        }),
      });
    });

    // Fill form with admin credentials
    await page.fill('input[name="email"]', 'admin@kazguu.kz');
    await page.fill('input[name="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL('**/admin', { timeout: 5000 });
    expect(page.url()).toContain('/admin');
  });

  test('should call logout when non-admin user tries to login', async ({ page }) => {
    // Mock login response with student role
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: {
            id: '1',
            email: 'student@kazguu.kz',
            role: 'student',
          },
        }),
      });
    });

    // Mock logout endpoint
    let logoutCalled = false;
    await page.route('**/api/auth/logout', async (route) => {
      logoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' }),
      });
    });

    // Fill form
    await page.fill('input[name="email"]', 'student@kazguu.kz');
    await page.fill('input[name="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.getByText(/Access denied|Admin privileges required/i)).toBeVisible();
    
    // Verify logout was called
    await page.waitForTimeout(1000);
    expect(logoutCalled).toBe(true);
  });
});

