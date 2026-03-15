import { test, expect } from '@playwright/test';
import { sidebar, navigateTo, toggleTheme } from './helpers';

test.describe('Claims Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Claims');
  });

  test.describe('List Panel', () => {
    test('shows header with title and count', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.locator('[class*="listTitle"]').first()).toBeVisible();
      await expect(listPanel.locator('[class*="listCount"]').first()).toBeVisible();
    });

    test('displays search input', async ({ page }) => {
      await expect(page.getByPlaceholder(/search claim/i)).toBeVisible();
    });

    test('shows status filter tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
    });

    test('renders claims from database', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.getByText('CLM-2026-001')).toBeVisible();
      await expect(listPanel.getByText('CLM-2026-002')).toBeVisible();
    });

    test('shows claim count badge', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.locator('[class*="listCount"]').first()).toBeVisible();
    });

    test('first claim is selected by default', async ({ page }) => {
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      const claimNumber = detailPanel.locator('[class*="detailClaimNumber"], [class*="claimNumber"]').first();
      await expect(claimNumber).toBeVisible();
    });

    test('search filters claims', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search claim/i);
      await searchInput.fill('Jacobs');
      await page.waitForTimeout(1000);
      await expect(listPanel.getByText('Jacobs')).toBeVisible();
      await expect(listPanel.getByText('CLM-2026-002')).not.toBeVisible();
    });

    test('clearing search restores list', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search claim/i);
      await searchInput.fill('Jacobs');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(1000);
      await expect(listPanel.getByText('CLM-2026-001')).toBeVisible();
      await expect(listPanel.getByText('CLM-2026-002')).toBeVisible();
    });

    test('status filter tabs work', async ({ page }) => {
      await page.getByRole('button', { name: 'Open' }).click();
      await page.waitForTimeout(1000);
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="claimItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Detail Panel', () => {
    test('shows status badge', async ({ page }) => {
      const badge = page.locator('[class*="statusBadge"]').first();
      await expect(badge).toBeVisible();
    });

    test('shows claim information card', async ({ page }) => {
      await expect(page.getByText('Claim Information')).toBeVisible();
    });

    test('shows description card', async ({ page }) => {
      await expect(page.getByText('Description')).toBeVisible();
    });

    test('shows checklist with progress', async ({ page }) => {
      await expect(page.getByText('Checklist')).toBeVisible();
    });

    test('shows tab bar', async ({ page }) => {
      const tabBar = page.locator('[class*="tabBar"]').first();
      await expect(tabBar.getByText('Details')).toBeVisible();
      await expect(tabBar.getByText('Documents')).toBeVisible();
      await expect(tabBar.getByText('Timeline')).toBeVisible();
      await expect(tabBar.getByText('Notes')).toBeVisible();
    });

    test('shows action buttons', async ({ page }) => {
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel.getByRole('button', { name: /Contact Client/i })).toBeVisible();
    });

    test('high value claims show priority badge', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await listPanel.getByText('CLM-2026-001').click();
      await page.waitForTimeout(1000);
      const highValue = page.locator('[class*="highValue"], [class*="priority"]').first();
      await expect(highValue).toBeVisible();
    });

    test('clicking another claim updates detail', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await listPanel.getByText('CLM-2026-002').click();
      await page.waitForTimeout(1000);
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel.getByText('CLM-2026-002')).toBeVisible();
    });

    test('works in both dark and light theme', async ({ page }) => {
      const splitView = page.locator('[class*="splitView"]').first();
      await expect(splitView).toBeVisible();
      await toggleTheme(page);
      await expect(splitView).toBeVisible();
      await expect(page.locator('[class*="listPanel"]').first().getByText('CLM-2026-001')).toBeVisible();
    });
  });
});
