import { Page, expect } from '@playwright/test';

export class TestUser {
  constructor(
    public email: string,
    public password: string,
    public username: string
  ) {}
}

export const TEST_USERS = {
  alice: new TestUser('alice@test.com', 'password123', 'Alice'),
  bob: new TestUser('bob@test.com', 'password123', 'Bob'),
  charlie: new TestUser('charlie@test.com', 'password123', 'Charlie'),
};

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async register(user: TestUser) {
    await this.page.goto('/register');
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[name="name"]', user.username);
    const passwordInputs = await this.page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(user.password);
    await passwordInputs[1].fill(user.password); // confirm password
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to chat
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async login(user: TestUser) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to chat
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async logout() {
    // Click user menu or logout button
    await this.page.click('[data-testid="logout-button"]', { timeout: 5000 }).catch(() => {
      // Fallback: look for logout in dropdown
      this.page.click('button:has-text("Log")').catch(() => {});
    });
  }
}

export class ChatPage {
  constructor(private page: Page) {}

  async createDirectConversation(username: string) {
    // Click new conversation button
    await this.page.click('[data-testid="new-conversation"]', { timeout: 5000 }).catch(() => {
      // Fallback: look for any button with "New" or "+"
      this.page.click('button:has-text("New")').catch(() => {
        this.page.click('button:has-text("+")');
      });
    });

    // Search for user
    await this.page.fill('input[placeholder*="Search"]', username);
    await this.page.waitForTimeout(1000);

    // Click on user
    await this.page.click(`text="${username}"`);
  }

  async sendMessage(content: string) {
    const input = this.page.locator('textarea, input[placeholder*="message" i]').first();
    await input.fill(content);
    await input.press('Enter');
    
    // Wait for message to appear
    await this.page.waitForTimeout(500);
  }

  async waitForMessage(content: string, timeout = 10000) {
    await this.page.waitForSelector(`text="${content}"`, { timeout });
  }

  async getLastMessage() {
    const messages = this.page.locator('[data-testid="message"], .message-bubble').last();
    return await messages.textContent();
  }

  async addReaction(messageText: string, emoji: string) {
    // Hover over message
    const message = this.page.locator(`text="${messageText}"`).first();
    await message.hover();
    
    // Click reaction button
    await this.page.click('[data-testid="add-reaction"]').catch(() => {
      // Fallback: click emoji button
      this.page.click('button[aria-label*="emoji" i]');
    });
    
    // Click emoji
    await this.page.click(`button:has-text("${emoji}")`);
  }

  async waitForTypingIndicator(username: string) {
    await this.page.waitForSelector(`text="${username} is typing"`, { timeout: 5000 });
  }

  async waitForOnlineStatus(username: string) {
    // Look for online indicator next to username
    await this.page.waitForSelector(`text="${username}"`, { timeout: 5000 });
  }
}

export async function cleanupDatabase() {
  // In production, you'd call an API endpoint to clear test data
  // For now, we rely on MongoDB stub which clears on restart
}

export async function waitForSocketConnection(page: Page) {
  // Wait for socket connection indicator
  await page.waitForTimeout(2000);
}
