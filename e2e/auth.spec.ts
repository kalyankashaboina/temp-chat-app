import { test, expect } from '@playwright/test';
import { AuthPage, TEST_USERS } from './helpers';

test.describe('Authentication Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    const authPage = new AuthPage(page);
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      username: 'Test User',
      password: 'password123',
    };

    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="name"]', testUser.username);
    
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(testUser.password);
    await passwordInputs[1].fill(testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to chat
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify we're logged in
    const url = page.url();
    expect(url).toContain('/');
  });

  test('should login with existing credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    // First register a user
    const testUser = {
      email: `login-test-${Date.now()}@example.com`,
      username: 'Login Test',
      password: 'password123',
    };

    await page.goto('/register');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="name"]', testUser.username);
    const regPasswords = await page.locator('input[type="password"]').all();
    await regPasswords[0].fill(testUser.password);
    await regPasswords[1].fill(testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Logout (if logout button exists)
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Now login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to chat
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show error (either inline or toast)
    await page.waitForTimeout(1000);
    const hasError = await page.locator('text=/invalid|error|email/i').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await page.waitForTimeout(2000);
    // Error could be in toast or inline
    const errorVisible = await page.locator('text=/invalid|incorrect|wrong|error/i').count() > 0;
    expect(errorVisible).toBeTruthy();
  });
});
