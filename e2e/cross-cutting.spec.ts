import { test, expect } from '@playwright/test';
import { sidebar, navigateTo, toggleTheme } from './helpers';

test.describe('Cross-cutting Concerns', () => {

  test.describe('Data Loading', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
    });

    test('dashboard loads task data from API', async ({ page }) => {
      const main = page.locator('main').first();
      const cards = main.locator('[class*="card"]');
      expect(await cards.count()).toBeGreaterThan(0);
    });

    test('clients page loads client data', async ({ page }) => {
      await navigateTo(page, 'Clients');
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="clientItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('policies page loads policy data', async ({ page }) => {
      await navigateTo(page, 'Policies');
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="policyItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('claims page loads claims data', async ({ page }) => {
      await navigateTo(page, 'Claims');
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="claimItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
    });

    test('dashboard has 3-column layout', async ({ page }) => {
      const sidebarEl = sidebar(page);
      const box = await sidebarEl.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(200);
      expect(box!.width).toBeLessThanOrEqual(300);
      const chatPanel = page.locator('section[class*="chat"]').first();
      await expect(chatPanel).toBeVisible();
    });

    test('split-view pages have 2-panel layout', async ({ page }) => {
      await navigateTo(page, 'Clients');
      const splitView = page.locator('[class*="splitView"]').first();
      await expect(splitView).toBeVisible();
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel).toBeVisible();
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel).toBeVisible();
    });
  });

  test.describe('Theme Consistency', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(2000);
    });

    test('all pages render in light theme', async ({ page }) => {
      await toggleTheme(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

      await navigateTo(page, 'Clients');
      const clientsSplitView = page.locator('[class*="splitView"]').first();
      await expect(clientsSplitView).toBeVisible();

      await navigateTo(page, 'Policies');
      const policiesSplitView = page.locator('[class*="splitView"]').first();
      await expect(policiesSplitView).toBeVisible();

      await navigateTo(page, 'Claims');
      const claimsSplitView = page.locator('[class*="splitView"]').first();
      await expect(claimsSplitView).toBeVisible();

      await navigateTo(page, 'Dashboard');
      await expect(page.getByText('Task Board')).toBeVisible();
    });

    test('sidebar remains visible across all pages', async ({ page }) => {
      await navigateTo(page, 'Clients');
      await expect(sidebar(page)).toBeVisible();

      await navigateTo(page, 'Policies');
      await expect(sidebar(page)).toBeVisible();

      await navigateTo(page, 'Claims');
      await expect(sidebar(page)).toBeVisible();
    });
  });
});
