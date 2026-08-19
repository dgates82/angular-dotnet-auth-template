import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login, loginAsAdmin, logout, ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/auth';

const PASSWORD = 'Passw0rd!';

test.describe('route guards', () => {
  test('LoginGuard redirects an already-authenticated user away from /login', async ({ page }) => {
    const email = uniqueEmail('loginguard');
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    await page.goto('/login');
    await page.waitForTimeout(1000);

    expect(page.url()).not.toContain('/login');
  });

  test('RoleGuard blocks a non-admin from /admin/users', async ({ page }) => {
    const email = uniqueEmail('roleguard');
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    await page.goto('/admin/users');

    await page.waitForURL('**/forbidden');
  });

  test('RoleGuard allows an admin to reach /admin/users', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/users');

    await expect(page.locator('table.table')).toBeVisible();
  });

  test('AuthGuard redirects an unauthenticated user away from a protected route', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForURL('**/login**');
  });

  test('AuthGuard allows access again after logging back in following a logout', async ({ page }) => {
    await loginAsAdmin(page);
    await logout(page);

    await page.goto('/home');
    await page.waitForURL('**/login**');

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL('**/home');
  });
});
