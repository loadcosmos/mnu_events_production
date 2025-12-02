import { test, expect } from '@playwright/test';

test.describe('Club Details Page', () => {
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

  test('should display club details page', async ({ page }) => {
    // First, we need to get a club ID from the clubs list
    await page.goto('http://localhost:5173/clubs');
    
    // Wait for clubs to load
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    // Try to find a club card and get its link
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    
    // If no clubs exist, skip the test
    const clubLinkCount = await clubLink.count();
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Get the club ID from the href
    const href = await clubLink.getAttribute('href');
    const clubId = href.split('/clubs/')[1];
    
    // Navigate to club details
    await clubLink.click();
    
    // Wait for club details page to load
    await page.waitForURL(`**/clubs/${clubId}`, { timeout: 5000 });
    
    // Check that club details page elements are visible
    await expect(page.getByText('Back to Clubs')).toBeVisible();
    
    // Check that at least some club information is displayed
    // (exact content depends on what clubs exist in the database)
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should show join button for non-members', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to clubs page
    await page.goto('http://localhost:5173/clubs');
    
    // Wait for clubs to load
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    // Find a club link
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    const clubLinkCount = await clubLink.count();
    
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Navigate to club details
    await clubLink.click();
    
    // Wait for page to load
    await page.waitForURL('**/clubs/**', { timeout: 5000 });
    
    // Check for join button or member status
    // The button might be "Join Club" or "Leave Club" depending on membership
    const joinButton = page.getByRole('button', { name: /Join Club/i });
    const leaveButton = page.getByRole('button', { name: /Leave Club/i });
    const organizerBadge = page.getByText(/You are the organizer/i);
    
    // At least one of these should be visible
    const hasJoin = await joinButton.isVisible().catch(() => false);
    const hasLeave = await leaveButton.isVisible().catch(() => false);
    const hasOrganizer = await organizerBadge.isVisible().catch(() => false);
    
    expect(hasJoin || hasLeave || hasOrganizer).toBeTruthy();
  });

  test('should allow joining a club', async ({ page }) => {
    // Login first
    await loginAsStudent(page);
    
    // Navigate to clubs page
    await page.goto('http://localhost:5173/clubs');
    
    // Wait for clubs to load
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    // Find a club link
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    const clubLinkCount = await clubLink.count();
    
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Navigate to club details
    await clubLink.click();
    
    // Wait for page to load
    await page.waitForURL('**/clubs/**', { timeout: 5000 });
    
    // Check if join button exists
    const joinButton = page.getByRole('button', { name: /Join Club/i });
    const isJoinVisible = await joinButton.isVisible().catch(() => false);
    
    if (isJoinVisible) {
      // Click join button
      await joinButton.click();
      
      // Wait for success message or button change
      await page.waitForSelector('text=Successfully joined', { timeout: 5000 }).catch(async () => {
        // If toast doesn't appear, check that button changed to "Leave Club"
        await expect(page.getByRole('button', { name: /Leave Club/i })).toBeVisible({ timeout: 3000 });
      });
    } else {
      // User is already a member or organizer, skip
      test.skip();
    }
  });

  test('should redirect to login when not authenticated and trying to join', async ({ page }) => {
    // Navigate to clubs page without login
    await page.goto('http://localhost:5173/clubs');
    
    // Wait for clubs to load
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    // Find a club link
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    const clubLinkCount = await clubLink.count();
    
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Navigate to club details
    await clubLink.click();
    
    // Wait for page to load
    await page.waitForURL('**/clubs/**', { timeout: 5000 });
    
    // Check for "Sign In to Join" button or similar
    const signInButton = page.getByRole('button', { name: /Sign In/i });
    const isSignInVisible = await signInButton.isVisible().catch(() => false);
    
    if (isSignInVisible) {
      // Click sign in button
      await signInButton.click();
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    } else {
      // Check if there's a join button that redirects
      const joinButton = page.getByRole('button', { name: /Join Club/i });
      const isJoinVisible = await joinButton.isVisible().catch(() => false);
      
      if (isJoinVisible) {
        await joinButton.click();
        await page.waitForURL('**/login', { timeout: 5000 });
        expect(page.url()).toContain('/login');
      }
    }
  });

  test('should display club information correctly', async ({ page }) => {
    // Navigate to clubs page
    await page.goto('http://localhost:5173/clubs');
    
    // Wait for clubs to load
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    // Find a club link
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    const clubLinkCount = await clubLink.count();
    
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Navigate to club details
    await clubLink.click();
    
    // Wait for page to load
    await page.waitForURL('**/clubs/**', { timeout: 5000 });
    
    // Check that back button is visible
    await expect(page.getByText('Back to Clubs')).toBeVisible();
    
    // Check that club information sections exist
    // (exact content depends on database)
    const hasOrganizerSection = await page.locator('text=Organizer').isVisible().catch(() => false);
    const hasStatsSection = await page.locator('text=Club Statistics').isVisible().catch(() => false);
    
    // At least one section should be visible
    expect(hasOrganizerSection || hasStatsSection).toBeTruthy();
  });

  test('should handle error when club not found', async ({ page }) => {
    // Navigate to non-existent club
    await page.goto('http://localhost:5173/clubs/00000000-0000-0000-0000-000000000000');
    
    // Should show error message
    await expect(
      page.getByText(/Failed to load club|not found|error/i)
    ).toBeVisible({ timeout: 5000 });
    
    // Should have retry or back button
    const retryButton = page.getByRole('button', { name: /Try Again|Back to Clubs/i });
    await expect(retryButton.first()).toBeVisible();
  });

  test('should display loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/clubs/*', async (route) => {
      if (route.request().method() === 'GET') {
        // Delay response
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      } else {
        await route.continue();
      }
    });
    
    // Navigate to clubs page first
    await page.goto('http://localhost:5173/clubs');
    await page.waitForSelector('text=Student Clubs', { timeout: 5000 });
    
    const clubLink = page.locator('a[href^="/clubs/"]').first();
    const clubLinkCount = await clubLink.count();
    
    if (clubLinkCount === 0) {
      test.skip();
      return;
    }
    
    // Navigate to club details
    await clubLink.click();
    
    // Check that loading indicator is shown
    await expect(page.getByText(/Loading club details/i)).toBeVisible({ timeout: 1000 });
  });
});

