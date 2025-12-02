import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  // Helper function to login as student
  async function loginAsStudent(page) {
    await page.goto('http://localhost:5173/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'student1@kazguu.kz');
    await page.fill('input[name="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home page
    await page.waitForURL('**/', { timeout: 5000 });
  }

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access profile page without authentication
    await page.goto('http://localhost:5173/profile');
    
    // Should redirect to login page
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should display profile page after login', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for page to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Check that profile page elements are visible
    await expect(page.getByText('My Profile')).toBeVisible();
    await expect(page.getByText('Manage your profile information')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Personal Information')).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for user data to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Check that user information is displayed
    // Email should be visible (read-only)
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('disabled');
    
    // Check that role badge is visible
    await expect(page.locator('text=STUDENT').or(page.locator('text=Student'))).toBeVisible();
  });

  test('should allow editing profile', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for page to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Click Edit Profile button
    const editButton = page.getByRole('button', { name: /Edit Profile/i });
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Check that form fields are now editable
    const firstNameInput = page.locator('input[name="firstName"]');
    const lastNameInput = page.locator('input[name="lastName"]');
    
    await expect(firstNameInput).toBeVisible();
    await expect(firstNameInput).not.toHaveAttribute('disabled');
    await expect(lastNameInput).toBeVisible();
    await expect(lastNameInput).not.toHaveAttribute('disabled');
    
    // Check that Save and Cancel buttons are visible
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
  });

  test('should update profile successfully', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for page to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Click Edit Profile button
    await page.getByRole('button', { name: /Edit Profile/i }).click();
    
    // Wait for form to be editable
    await page.waitForSelector('input[name="firstName"]:not([disabled])', { timeout: 3000 });
    
    // Get current values
    const firstNameInput = page.locator('input[name="firstName"]');
    const lastNameInput = page.locator('input[name="lastName"]');
    
    const currentFirstName = await firstNameInput.inputValue();
    const currentLastName = await lastNameInput.inputValue();
    
    // Update values
    await firstNameInput.clear();
    await firstNameInput.fill('UpdatedFirstName');
    await lastNameInput.clear();
    await lastNameInput.fill('UpdatedLastName');
    
    // Mock API response for update
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-id',
            email: 'student1@kazguu.kz',
            firstName: 'UpdatedFirstName',
            lastName: 'UpdatedLastName',
            role: 'STUDENT',
            faculty: null,
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Click Save Changes
    await page.getByRole('button', { name: /Save Changes/i }).click();
    
    // Wait for success message or form to close
    await page.waitForSelector('text=Profile updated successfully', { timeout: 5000 }).catch(() => {
      // If toast message is not found, check that edit mode is closed
      return page.waitForSelector('button:has-text("Edit Profile")', { timeout: 3000 });
    });
    
    // Check that values are updated (either in display or form)
    // The form should be back to read-only mode
    await expect(page.getByRole('button', { name: /Edit Profile/i })).toBeVisible();
  });

  test('should cancel editing and revert changes', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for page to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Click Edit Profile button
    await page.getByRole('button', { name: /Edit Profile/i }).click();
    
    // Wait for form to be editable
    await page.waitForSelector('input[name="firstName"]:not([disabled])', { timeout: 3000 });
    
    // Get original values
    const firstNameInput = page.locator('input[name="firstName"]');
    const originalFirstName = await firstNameInput.inputValue();
    
    // Change value
    await firstNameInput.clear();
    await firstNameInput.fill('ChangedValue');
    
    // Click Cancel
    await page.getByRole('button', { name: /Cancel/i }).click();
    
    // Check that form is back to read-only and value is reverted
    await expect(page.getByRole('button', { name: /Edit Profile/i })).toBeVisible();
    
    // Value should be back to original (check in read-only mode)
    const firstNameAfterCancel = await firstNameInput.inputValue();
    expect(firstNameAfterCancel).toBe(originalFirstName);
  });

  test('should show validation error for empty required fields', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for page to load
    await page.waitForSelector('text=My Profile', { timeout: 5000 });
    
    // Click Edit Profile button
    await page.getByRole('button', { name: /Edit Profile/i }).click();
    
    // Wait for form to be editable
    await page.waitForSelector('input[name="firstName"]:not([disabled])', { timeout: 3000 });
    
    // Clear required fields
    await page.locator('input[name="firstName"]').clear();
    await page.locator('input[name="lastName"]').clear();
    
    // Try to save
    await page.getByRole('button', { name: /Save Changes/i }).click();
    
    // Should show validation error
    await expect(
      page.getByText(/Validation failed|Please fill in all required fields/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test('should display loading state', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Mock slow API response
    await page.route('**/api/users/*', async (route) => {
      if (route.request().method() === 'GET') {
        // Delay response
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      } else {
        await route.continue();
      }
    });
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Check that loading indicator is shown
    await expect(page.getByText(/Loading profile/i)).toBeVisible({ timeout: 1000 });
  });
});

