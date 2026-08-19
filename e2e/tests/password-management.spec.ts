import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login } from '../helpers/auth';
import { getLatestEmail, extractLink } from '../helpers/mailpit';
import { dismissSwal } from '../helpers/swal';

const PASSWORD = 'Passw0rd!';
const NEW_PASSWORD = 'NewPassw0rd!';

test.describe('password management', () => {
  test('changing password while authenticated takes effect on the next login', async ({ page }) => {
    const email = uniqueEmail('change-password');
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    await page.goto('/profile');
    await page.getByText('Password and Security').click();
    await page.getByRole('button', { name: 'Update Password' }).click();
    await page.locator('input[formcontrolname="currentPassword"]').fill(PASSWORD);
    await page.locator('input[formcontrolname="newPassword"]').fill(NEW_PASSWORD);
    await page.locator('input[formcontrolname="confirmPassword"]').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Password updated')).toBeVisible();
    await dismissSwal(page);

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    await login(page, email, NEW_PASSWORD);
    await page.waitForURL('**/home');
  });

  test('forgot password: reset via the emailed link, then log in with the new password', async ({ page }) => {
    const email = uniqueEmail('forgot-password');
    await registerAndConfirm(page, email, PASSWORD);

    const start = Date.now();
    await page.goto('/forgot-password');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    const resetEmail = await getLatestEmail(email, { sinceMs: start });
    const link = extractLink(resetEmail, 'forgot-password/reset');
    await page.goto(link);

    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="newPassword"]').fill(NEW_PASSWORD);
    await page.locator('input[formcontrolname="confirmPassword"]').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Password reset complete')).toBeVisible();

    await login(page, email, NEW_PASSWORD);
    await page.waitForURL('**/home');
  });
});
