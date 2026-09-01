import { test, expect, Page } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login } from '../helpers/auth';
import { getLatestEmail, extractCode } from '../helpers/email-mock';
import { getLatestSms } from '../helpers/sms-mock';
import { normalizeSecret, generateCode } from '../helpers/totp';

const PASSWORD = 'Passw0rd!';

/** Opens the profile's 2FA toggle and picks a method from the resulting method-choice screen. */
async function startEnrollment(page: Page, method: 'Authenticator' | 'Email' | 'SMS'): Promise<void> {
  await page.goto('/profile');
  await page.getByText('Password and Security').click();
  await page.locator('mat-slide-toggle').first().click();
  if (method !== 'Authenticator') {
    // Authenticator is the pre-selected default - only need to pick the others explicitly.
    await page.getByText(method, { exact: true }).click();
  }
  await page.getByRole('button', { name: 'Next' }).click();
}

test.describe('two-factor authentication', () => {
  test('Authenticator: enable, then log in with a generated code', async ({ page }) => {
    const email = uniqueEmail('2fa-authenticator');
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    await startEnrollment(page, 'Authenticator');
    const sharedKey = page.locator('kbd');
    await expect(sharedKey).not.toHaveText('');
    const secret = normalizeSecret((await sharedKey.textContent()) ?? '');
    await page.locator('input[formcontrolname="code"]').pressSequentially(await generateCode(secret), { delay: 30 });
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('authenticator app has been configured')).toBeVisible();

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    await login(page, email, PASSWORD);
    await page.locator('input[formcontrolname="twoFaCode"]').waitFor();
    await page.locator('input[formcontrolname="twoFaCode"]').pressSequentially(await generateCode(secret), { delay: 30 });
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('**/home');
  });

  test('Email: enable, then log in with the emailed code', async ({ page }) => {
    const email = uniqueEmail('2fa-email');
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    const enrollStart = Date.now();
    await startEnrollment(page, 'Email');
    const enrollEmail = await getLatestEmail(email, { sinceMs: enrollStart });
    await page.locator('input[formcontrolname="code"]').pressSequentially(extractCode(enrollEmail.Text || enrollEmail.HTML), { delay: 30 });
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('email has been verified')).toBeVisible();

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    const loginStart = Date.now();
    await login(page, email, PASSWORD);
    await page.locator('input[formcontrolname="twoFaCode"]').waitFor();
    const loginEmail = await getLatestEmail(email, { sinceMs: loginStart });
    await page.locator('input[formcontrolname="twoFaCode"]').pressSequentially(extractCode(loginEmail.Text || loginEmail.HTML), { delay: 30 });
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('**/home');
  });

  test('SMS: enable as the first method, then log in with the texted code', async ({ page }) => {
    const email = uniqueEmail('2fa-sms');
    const phoneNumber = '555' + String(Date.now()).slice(-7);
    await registerAndConfirm(page, email, PASSWORD);
    await login(page, email, PASSWORD);
    await page.waitForURL('**/home');

    const enrollStart = Date.now();
    await startEnrollment(page, 'SMS');
    await page.locator('input[formcontrolname="phoneNumber"]').pressSequentially(phoneNumber, { delay: 20 });
    await page.getByRole('button', { name: 'Send Verification Code' }).click();
    const enrollSms = await getLatestSms(phoneNumber, enrollStart);
    await page.locator('input[formcontrolname="code"]').pressSequentially(extractCode(enrollSms.body), { delay: 30 });
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('phone number has been verified')).toBeVisible();

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    const loginStart = Date.now();
    await login(page, email, PASSWORD);
    await page.locator('input[formcontrolname="twoFaCode"]').waitFor();
    const loginSms = await getLatestSms(phoneNumber, loginStart);
    await page.locator('input[formcontrolname="twoFaCode"]').pressSequentially(extractCode(loginSms.body), { delay: 30 });
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('**/home');
  });

  // Switching to SMS from an already-enabled method (Email/Authenticator) is left out
  // deliberately - it depends on the SendTwoFaCodeAsync fix from Jwt2Fa#16, which hasn't
  // been pulled into a released package version yet. Add once that lands.
});
