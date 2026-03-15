import { test, expect } from '@playwright/test';
import { sidebar, navigateTo } from './helpers';

test.describe('Clients Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Clients');
  });

  test.describe('List Panel', () => {
    test('shows header with title and count', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.locator('[class*="listTitle"]').first()).toBeVisible();
      await expect(listPanel.getByText(/Clients/)).toBeVisible();
      await expect(listPanel.locator('[class*="listCount"]').first()).toBeVisible();
    });

    test('displays search input', async ({ page }) => {
      await expect(page.getByPlaceholder(/search client/i)).toBeVisible();
    });

    test('renders all clients from database', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.getByText('Van der Merwe Family Trust')).toBeVisible();
      await expect(listPanel.getByText('John Smith')).toBeVisible();
      await expect(listPanel.getByText(/Moosa Family/)).toBeVisible();
      await expect(listPanel.getByText(/Botha Family/)).toBeVisible();
    });

    test('shows client type and policy count', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.getByText(/trust/i).first()).toBeVisible();
      await expect(listPanel.getByText(/policies/i).first()).toBeVisible();
    });

    test('shows premium amounts', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await expect(listPanel.getByText(/R \d+K/).first()).toBeVisible();
    });

    test('first client is selected by default', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const selectedItem = listPanel.locator('[class*="Selected"]').first();
      await expect(selectedItem).toBeVisible({ timeout: 10000 });
    });

    test('search filters clients by name', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search client/i);
      await searchInput.fill('Nkosi');
      await page.waitForTimeout(1000);
      await expect(listPanel.getByText('Nkosi Transport')).toBeVisible();
      await expect(listPanel.getByText('Van der Merwe')).not.toBeVisible();
    });

    test('clearing search restores full list', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search client/i);
      await searchInput.fill('Nkosi');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(1000);
      await expect(listPanel.getByText('Van der Merwe')).toBeVisible();
      await expect(listPanel.getByText('John Smith')).toBeVisible();
    });

    test('search with no results shows empty list', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      const searchInput = page.getByPlaceholder(/search client/i);
      await searchInput.fill('zzzznonexistent');
      await page.waitForTimeout(1000);
      const items = listPanel.locator('[class*="clientItem"], [class*="policyItem"], [class*="listItem"]');
      await expect(items).toHaveCount(0);
    });
  });

  test.describe('Detail Panel', () => {
    test('shows selected client name as heading', async ({ page }) => {
      const heading = page.locator('[class*="detailPanel"]').first().locator('h1').first();
      await expect(heading).toContainText('Van der Merwe Family Trust');
    });

    test('displays type badge', async ({ page }) => {
      const badge = page.locator('[class*="typeBadge"]').first();
      await expect(badge).toBeVisible();
    });

    test('shows contact email', async ({ page }) => {
      await expect(page.getByText('info@vdmtrust.co.za')).toBeVisible();
    });

    test('shows stat cards', async ({ page }) => {
      await expect(page.getByText('Active Policies')).toBeVisible();
      await expect(page.getByText('Annual Premium')).toBeVisible();
      await expect(page.getByText('Open Claims')).toBeVisible();
    });

    test('displays policy cards for selected client', async ({ page }) => {
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel.getByText('BRY-COM-4421')).toBeVisible();
      await expect(detailPanel.getByText('SAN-FLT-7782')).toBeVisible();
      await expect(detailPanel.getByText('HOL-LIA-3310')).toBeVisible();
    });

    test('shows action buttons', async ({ page }) => {
      const detailPanel = page.locator('[class*="detailPanel"]').first();
      await expect(detailPanel.getByRole('button', { name: /Edit/i })).toBeVisible();
      await expect(detailPanel.getByRole('button', { name: /New Task/i })).toBeVisible();
      await expect(detailPanel.getByRole('button', { name: /Chat/i })).toBeVisible();
    });

    test('shows tab bar with all tabs', async ({ page }) => {
      const tabBar = page.locator('[class*="tabBar"]').first();
      await expect(tabBar.getByText('Overview')).toBeVisible();
      await expect(tabBar.getByText('Policies')).toBeVisible();
      await expect(tabBar.getByText('Claims')).toBeVisible();
      await expect(tabBar.getByText('Activity')).toBeVisible();
      await expect(tabBar.getByText('Documents')).toBeVisible();
    });

    test('shows Recent Activity section', async ({ page }) => {
      await expect(page.getByText('Recent Activity')).toBeVisible();
    });

    test('clicking another client updates detail', async ({ page }) => {
      const listPanel = page.locator('[class*="listPanel"]').first();
      await listPanel.getByText('John Smith').click();
      await page.waitForTimeout(1000);
      const heading = page.locator('[class*="detailPanel"]').first().locator('h1').first();
      await expect(heading).toContainText('John Smith');
    });
  });
});
