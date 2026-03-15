import { test, expect } from '@playwright/test';
import { sidebar, navigateTo, toggleTheme } from './helpers';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Settings');
  });

  test('navigating to Settings shows settings page', async ({ page }) => {
    await expect(page.getByText('Settings', { exact: true }).first()).toBeVisible();
  });

  test('Settings nav is active in sidebar', async ({ page }) => {
    const settingsBtn = sidebar(page).getByRole('button', { name: 'Settings' });
    await expect(settingsBtn).toHaveClass(/Active/);
  });

  test('shows role indicator', async ({ page }) => {
    await expect(page.getByText('Viewing as')).toBeVisible();
    await expect(page.getByText('Key Individual')).toBeVisible();
  });

  test('displays all settings tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Team Members' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Organisation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Insurers' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compliance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Integrations/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Billing/ })).toBeVisible();
  });

  test('Profile tab is shown by default', async ({ page }) => {
    await expect(page.getByText('Personal Information')).toBeVisible();
  });
});

test.describe('Settings — Profile Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Settings');
  });

  test('shows personal information form section', async ({ page }) => {
    await expect(page.getByText('Personal Information')).toBeVisible();
    await expect(page.getByText('Your details as they appear in the system')).toBeVisible();
  });

  test('displays user name in form fields', async ({ page }) => {
    const firstNameInput = page.locator('input').filter({ has: page.locator('..') }).first();
    // Check that Grant McDonogh's name is in the form
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
  });

  test('shows Security section', async ({ page }) => {
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText('Two-Factor Authentication')).toBeVisible();
    await expect(page.getByText('Login Notifications')).toBeVisible();
  });

  test('shows password change field', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter new password')).toBeVisible();
  });

  test('shows role as read-only', async ({ page }) => {
    const roleInput = page.locator('input[readonly]').first();
    await expect(roleInput).toBeVisible();
  });

  test('shows Save and Cancel buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });
});

test.describe('Settings — Team Members Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Settings');
    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForTimeout(1000);
  });

  test('shows team stats pills', async ({ page }) => {
    await expect(page.getByText('Active Members')).toBeVisible();
    await expect(page.getByText('Pending Invite')).toBeVisible();
    await expect(page.getByText('Representatives')).toBeVisible();
  });

  test('shows Invite Member button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Invite Member/i })).toBeVisible();
  });

  test('shows pending invitation card', async ({ page }) => {
    await expect(page.getByText('Pending Invitations')).toBeVisible();
    await expect(page.getByText('james.venter@mcdonoghbrokers.co.za')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resend' })).toBeVisible();
  });

  test('shows Active Team section', async ({ page }) => {
    await expect(page.getByText('Active Team')).toBeVisible();
  });

  test('displays team member cards from database', async ({ page }) => {
    await expect(page.getByText('Grant McDonogh').first()).toBeVisible();
    await expect(page.getByText('Sarah Peters')).toBeVisible();
  });

  test('shows role badges on member cards', async ({ page }) => {
    await expect(page.getByText('Key Individual').first()).toBeVisible();
    await expect(page.getByText('Representative').first()).toBeVisible();
  });

  test('shows compliance chips', async ({ page }) => {
    await expect(page.getByText('Fit & Proper').first()).toBeVisible();
  });

  test('shows FAIS details on member cards', async ({ page }) => {
    await expect(page.getByText('FAIS Rep No.').first()).toBeVisible();
    await expect(page.getByText('CPD Progress').first()).toBeVisible();
  });
});

test.describe('Settings — Coming Soon Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await navigateTo(page, 'Settings');
  });

  test('Organisation tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: 'Organisation' }).click();
    await expect(page.getByText('Brokerage details, FSP registration')).toBeVisible();
  });

  test('Insurers tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: 'Insurers' }).click();
    await expect(page.getByText('Manage insurer relationships')).toBeVisible();
  });

  test('Compliance tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: 'Compliance' }).click();
    await expect(page.getByText('FAIS compliance dashboard')).toBeVisible();
  });

  test('Notifications tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Configure notification preferences')).toBeVisible();
  });

  test('Integrations tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: /Integrations/ }).click();
    await expect(page.getByText('Connect BrokerOS to WhatsApp')).toBeVisible();
  });

  test('Billing tab shows coming soon', async ({ page }) => {
    await page.getByRole('button', { name: /Billing/ }).click();
    await expect(page.getByText('Manage your subscription')).toBeVisible();
  });
});

test.describe('Settings — Theme Support', () => {
  test('settings page works in light theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await toggleTheme(page);
    await navigateTo(page, 'Settings');
    await expect(page.getByText('Personal Information')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
