import { test, expect } from '@playwright/test';
import { sidebar } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('shows BrokerOS logo in sidebar', async ({ page }) => {
    await expect(sidebar(page).getByText('BrokerOS')).toBeVisible();
  });

  test('displays all sidebar navigation items', async ({ page }) => {
    const nav = sidebar(page);
    await expect(nav.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Clients' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Policies' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Claims' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('shows user profile in sidebar footer', async ({ page }) => {
    const nav = sidebar(page);
    await expect(nav.getByText('Grant McDonogh')).toBeVisible();
    await expect(nav.getByText('Key Individual')).toBeVisible();
  });

  test('displays Task Board header with actions', async ({ page }) => {
    await expect(page.getByText('Task Board')).toBeVisible();
    await expect(page.getByRole('button', { name: /New task/i })).toBeVisible();
  });

  test('shows all four Kanban columns', async ({ page }) => {
    await expect(page.getByText('To Do', { exact: true })).toBeVisible();
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
    await expect(page.getByText('Review', { exact: true })).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();
  });

  test('displays task cards from database', async ({ page }) => {
    await expect(page.getByText('Review renewal pack for Van der Merwe Family Trust')).toBeVisible();
    await expect(page.getByText('Add Toyota Hilux to J. Smith motor policy')).toBeVisible();
  });

  test('shows AI-active indicators on processing tasks', async ({ page }) => {
    const aiIndicators = page.locator('[class*="aiActive"], [class*="ai-active"], [class*="aiStatus"]');
    await expect(aiIndicators.first()).toBeVisible();
  });

  test('displays chat panel alongside task board', async ({ page }) => {
    const chatPanel = page.locator('section[class*="chat"]').first();
    await expect(chatPanel).toBeVisible();
  });
});
