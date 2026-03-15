import { test, expect } from '@playwright/test';
import { sidebar, navigateTo } from './helpers';

test.describe('Policies Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Policies');
  });

  test.describe('List Panel', () => {
    test('shows header with title and count', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.locator('[class*="listTitle"]').first()).toBeVisible();
      await expect(listPanel.getByText(/Policies/)).toBeVisible();
      await expect(listPanel.locator('[class*="listCount"]').first()).toBeVisible();
    });

    test('displays search input', async ({ page }) => {
      await expect(page.getByPlaceholder(/search polic/i)).toBeVisible();
    });

    test('renders policies from database', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="policyItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('first policy is selected by default', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const selectedItem = listPanel.locator('[class*="Selected"]').first();
      await expect(selectedItem).toBeVisible();
    });

    test('shows type indicator colors', async ({ page }) => {
      const indicator = page.locator('[class*="typeIndicator"]').first();
      await expect(indicator).toBeVisible();
    });

    test('search filters policies', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search polic/i);
      await searchInput.fill('zzzznonexistent');
      await page.waitForTimeout(1000);
      const items = listPanel.locator('[class*="policyItem"], [class*="listItem"]');
      await expect(items).toHaveCount(0);
    });

    test('clearing search restores list', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search polic/i);
      await searchInput.fill('zzz');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(1000);
      const items = listPanel.locator('[class*="policyItem"], [class*="listItem"]');
      expect(await items.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Detail Panel', () => {
    test('shows policy number as heading', async ({ page }) => {
      const heading = page.locator('[class*="detailPanel"]').first().locator('h1').first();
      await expect(heading).toBeVisible();
      const text = await heading.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });

    test('displays type badge', async ({ page }) => {
      const badge = page.locator('[class*="typeBadge"]').first();
      await expect(badge).toBeVisible();
    });

    test('shows insurer name', async ({ page }) => {
      const insurer = page.locator('[class*="detailInsurer"]').first();
      await expect(insurer).toBeVisible();
    });

    test('shows action buttons', async ({ page }) => {
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel.getByRole('button', { name: /Edit/i })).toBeVisible();
      await expect(detailPanel.getByRole('button', { name: /Renew/i })).toBeVisible();
      await expect(detailPanel.getByRole('button', { name: /Chat/i })).toBeVisible();
    });

    test('shows tab bar', async ({ page }) => {
      const tabBar = page.locator('[class*="tabBar"]').first();
      await expect(tabBar.getByText('Overview')).toBeVisible();
      await expect(tabBar.getByText('Coverage')).toBeVisible();
      await expect(tabBar.getByText('Claims')).toBeVisible();
      await expect(tabBar.getByText('Documents')).toBeVisible();
      await expect(tabBar.getByText('Activity')).toBeVisible();
    });

    test('overview shows stat cards', async ({ page }) => {
      await expect(page.getByText(/annual premium/i).first()).toBeVisible();
      await expect(page.getByText(/sum insured/i).first()).toBeVisible();
      await expect(page.getByText(/excess/i).first()).toBeVisible();
    });

    test('overview shows Policy Details section', async ({ page }) => {
      await expect(page.getByText('Policy Details')).toBeVisible();
    });

    test('policy details grid shows key fields', async ({ page }) => {
      await expect(page.getByText('Policy Number').first()).toBeVisible();
      await expect(page.getByText('Client').first()).toBeVisible();
      await expect(page.getByText('Insurer').first()).toBeVisible();
      await expect(page.getByText('Renewal Date').first()).toBeVisible();
    });

    test('overview shows Recent Activity', async ({ page }) => {
      await expect(page.getByText('Recent Activity')).toBeVisible();
    });

    test('clicking another policy updates detail', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const items = listPanel.locator('[class*="policyItem"], [class*="listItem"]');
      const count = await items.count();
      if (count > 1) {
        await items.nth(1).click();
        await page.waitForTimeout(1000);
      }
      const selectedItems = listPanel.locator('[class*="Selected"]');
      expect(await selectedItems.count()).toBe(1);
    });

    test('Coverage tab shows coverage content', async ({ page }) => {
      const tabBar = page.locator('[class*="tabBar"]').first();
      await tabBar.getByText('Coverage').click();
      await page.waitForTimeout(1000);
      const coverageSummary = page.locator('[class*="coverageSummary"], [class*="coverage"]').first();
      await expect(coverageSummary).toBeVisible();
    });
  });
});
