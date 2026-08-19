import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login } from '../helpers/auth';

const PASSWORD = 'Passw0rd!';

test.describe('registration and email confirmation', () => {
  test('logging in before confirming the email is rejected', async ({ page }) => {
    const email = uniqueEmail('register-unconfirmed');

    await page.goto('/register');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.locator('input[formcontrolname="newPassword"]').fill(PASSWORD);
    await page.locator('input[formcontrolname="confirmPassword"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText("You've been registered!")).toBeVisible();

    await login(page, email, PASSWORD);
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/login');
  });

  test('registering, confirming, then logging in succeeds', async ({ page }) => {
    const email = uniqueEmail('register-confirm');

    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);

    await page.waitForURL('**/home');
  });

  test('two independent registrations do not interfere with each other', async ({ page }) => {
    const emailA = uniqueEmail('register-isolation-a');
    const emailB = uniqueEmail('register-isolation-b');

    await registerAndConfirm(page, emailA, PASSWORD);
    await login(page, emailA, PASSWORD);
    await page.waitForURL('**/home');

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    await registerAndConfirm(page, emailB, PASSWORD);
    await login(page, emailB, PASSWORD);
    await page.waitForURL('**/home');
  });
});
