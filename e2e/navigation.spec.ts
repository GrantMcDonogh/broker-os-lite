import { test, expect } from '@playwright/test';
import { sidebar, navigateTo, toggleTheme } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('Dashboard nav is active by default', async ({ page }) => {
    const dashboardBtn = sidebar(page).getByRole('button', { name: 'Dashboard' });
    await expect(dashboardBtn).toHaveClass(/Active/);
  });

  test('navigating to Clients shows clients page', async ({ page }) => {
    await navigateTo(page, 'Clients');
    await expect(page.getByPlaceholder(/search client/i)).toBeVisible();
  });

  test('navigating to Policies shows policies page', async ({ page }) => {
    await navigateTo(page, 'Policies');
    await expect(page.getByPlaceholder(/search polic/i)).toBeVisible();
  });

  test('navigating to Claims shows claims page', async ({ page }) => {
    await navigateTo(page, 'Claims');
    await expect(page.getByPlaceholder(/search claim/i)).toBeVisible();
  });

  test('navigating back to Dashboard restores task board', async ({ page }) => {
    await navigateTo(page, 'Clients');
    await navigateTo(page, 'Dashboard');
    await expect(page.getByText('Task Board')).toBeVisible();
  });

  test('active nav state updates on navigation', async ({ page }) => {
    await navigateTo(page, 'Clients');
    const clientsBtn = sidebar(page).getByRole('button', { name: 'Clients' });
    const dashboardBtn = sidebar(page).getByRole('button', { name: 'Dashboard' });
    await expect(clientsBtn).toHaveClass(/Active/);
    await expect(dashboardBtn).not.toHaveClass(/Active/);
  });

  test('chat panel only shows on Dashboard', async ({ page }) => {
    const chatPanel = page.locator('section[class*="chat"]');
    await expect(chatPanel.first()).toBeVisible();
    await navigateTo(page, 'Clients');
    await expect(chatPanel).toHaveCount(0);
  });
});

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('defaults to dark theme', async ({ page }) => {
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme === null || theme === 'dark').toBeTruthy();
  });

  test('toggles to light theme and back', async ({ page }) => {
    await toggleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await toggleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('theme persists across page navigation', async ({ page }) => {
    await toggleTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await navigateTo(page, 'Clients');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
