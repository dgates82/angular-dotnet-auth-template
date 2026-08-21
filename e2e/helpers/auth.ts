import { Page, expect } from '@playwright/test';

import { getLatestEmail, extractLink } from './mailpit';

export const ADMIN_EMAIL = 'admin@example.com';
export const ADMIN_PASSWORD = 'Password1!';

/** A per-run-unique email, so tests never collide with each other or with leftover data. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
}

/** Registers a new account and follows its confirmation link, leaving the account confirmed but logged out. */
export async function registerAndConfirm(page: Page, email: string, password: string): Promise<void> {
  const start = Date.now();
  await page.goto('/register');
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="newPassword"]').fill(password);
  await page.locator('input[formcontrolname="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText("You've been registered!")).toBeVisible();

  const confirmationEmail = await getLatestEmail(email, { subjectContains: 'Email Confirmation', sinceMs: start });
  const link = extractLink(confirmationEmail, 'email-confirmation');
  await page.goto(link);
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL('**/home');
}

/** Logs out via the confirmation page - /logout is not an instant action, it needs the Logout button clicked. */
export async function logout(page: Page): Promise<void> {
  await page.goto('/logout');
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
}
