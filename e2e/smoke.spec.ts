import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Functionality', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should load the register page', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Should have multiple password fields (password + confirm)
    const passwordFields = page.locator('input[type="password"]');
    const count = await passwordFields.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have working navigation between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Click link to register
    await page.click('text=/sign up|create account|register/i');
    
    // Should navigate to register page
    await page.waitForURL('**/register', { timeout: 5000 });
    expect(page.url()).toContain('register');
    
    // Click link back to login
    await page.click('text=/log in|sign in|already have/i');
    
    // Should navigate back to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('should show validation error for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling anything
    await page.click('button[type="submit"]');
    
    // Should show some kind of validation feedback
    await page.waitForTimeout(1000);
    
    // Check for HTML5 validation or custom error messages
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    expect(isInvalid).toBeTruthy();
  });

  test('should register a new user and redirect to chat', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `smoke-test-${timestamp}@example.com`,
      name: `Smoke Test User ${timestamp}`,
      password: 'TestPassword123!',
    };

    await page.goto('/register');
    
    // Fill the form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="name"]', testUser.name);
    
    // Fill both password fields
    const passwordFields = await page.locator('input[type="password"]').all();
    await passwordFields[0].fill(testUser.password);
    await passwordFields[1].fill(testUser.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to main chat (root path)
    await page.waitForURL('/', { timeout: 15000 });
    
    // Verify we're on the chat page
    expect(page.url()).toBe('http://localhost:5173/');
    
    // Take screenshot for verification
    await page.screenshot({ path: '/tmp/after-registration.png' });
  });

  test('should show backend health check works', async ({ request }) => {
    const response = await request.get('http://localhost:4000/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });
});
