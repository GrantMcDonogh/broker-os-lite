import { Page, expect } from '@playwright/test';

export const sidebar = (page: Page) => page.locator('aside').first();

export async function navigateTo(page: Page, navName: string) {
  await sidebar(page).getByRole('button', { name: navName }).click();
  await page.waitForTimeout(3000);
}

export async function toggleTheme(page: Page) {
  const toggle = sidebar(page).locator('button[aria-label*="Switch" i]').first();
  await toggle.click();
  await page.waitForTimeout(500);
}
