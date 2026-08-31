import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login, loginAsAdmin, logout } from '../helpers/auth';
import { openEditUserByEmail, adminCreateUser } from '../helpers/admin';
import { dismissSwal } from '../helpers/swal';
import { getLatestEmail, extractLink } from '../helpers/email-mock';

const PASSWORD = 'Passw0rd!';

test.describe('admin user management', () => {
  test('admin can log in and reach the paginated user list', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/users');

    await expect(page.locator('table.table')).toBeVisible();
  });

  test('admin can edit a user\'s profile fields and assign a role sourced from the live roles endpoint', async ({ page }) => {
    const targetEmail = uniqueEmail('admin-edit-target');
    await registerAndConfirm(page, targetEmail, PASSWORD);

    await loginAsAdmin(page);
    await openEditUserByEmail(page, targetEmail);

    await page.getByRole('button', { name: 'Edit' }).click();
    // firstName is required (requiredProfileFields.firstName in environment.ts) and the
    // self-registered target user never set one, so it must be filled or Save no-ops.
    await page.locator('input[formcontrolname="firstName"]').fill('Test');
    await page.locator('input[formcontrolname="lastName"]').fill('Updated');
    // "Tech" only exists because DbSeeder seeds it and the dropdown reads from
    // GET api/admin/roles - a hardcoded client-side list wouldn't catch a regression
    // here the way this does (see #75).
    await page.locator('mat-select[formcontrolname="addRoleControl"]').click();
    await page.getByRole('option', { name: 'Tech', exact: true }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('User Updated')).toBeVisible();
    await dismissSwal(page);

    await expect(page.locator('input[formcontrolname="lastName"]')).toHaveValue('Updated');
  });

  test('deactivating a user blocks their login, and reactivating restores it', async ({ page }) => {
    const targetEmail = uniqueEmail('admin-deactivate-target');
    await registerAndConfirm(page, targetEmail, PASSWORD);

    await loginAsAdmin(page);
    await openEditUserByEmail(page, targetEmail);

    await page.getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('button', { name: 'Yes, deactivate' }).click();
    await dismissSwal(page);
    // getByText('DEACTIVATED') would also match the Swal2 "User deactivated" title
    // (case-insensitive substring matching) - scope to the page's own h1.
    await expect(page.locator('h1')).toContainText('DEACTIVATED');

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    await login(page, targetEmail, PASSWORD);
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/home');

    await loginAsAdmin(page);
    await openEditUserByEmail(page, targetEmail, { includeInactive: true });
    await page.getByRole('button', { name: 'Re-Activate' }).click();
    await page.getByRole('button', { name: 'Yes, re-activate' }).click();
    await dismissSwal(page);

    await page.goto('/logout');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    await login(page, targetEmail, PASSWORD);
    await page.waitForURL('**/home');
  });

  test('admin can resend a setup link once an admin-created user\'s email is confirmed but no password is set', async ({ page }) => {
    const targetEmail = uniqueEmail('admin-created-target');

    const createStart = Date.now();
    await loginAsAdmin(page);
    await adminCreateUser(page, { firstName: 'Test', lastName: 'User', email: targetEmail });

    // Follow the account-creation email's link to confirm the email, but abandon it
    // before setting a password - this is exactly the "stuck" state the resend link
    // exists for. The link auto-confirms on load and (since it carries
    // isFirstLogin=true) redirects into the password-set form; navigating away
    // instead of completing it leaves emailConfirmed: true, hasSetPassword: false.
    // /email-confirmation is LoginGuard-gated (logged-out only), so log out of the
    // admin session first - visiting it while still authenticated as admin just
    // bounces straight to /home without ever calling confirmEmail().
    const creationEmail = await getLatestEmail(targetEmail, { sinceMs: createStart });
    const confirmLink = extractLink(creationEmail, 'email-confirmation');
    await logout(page);
    await page.goto(confirmLink);
    // Wait for the confirmEmail() call to actually complete (signaled by the app's own
    // client-side redirect into the password-set form) before navigating away - leaving
    // immediately would cancel the in-flight request and leave email unconfirmed.
    await page.waitForURL('**/email-confirmation/reset**');
    await loginAsAdmin(page);

    await openEditUserByEmail(page, targetEmail);
    await page.getByText('Password and Security').click();
    await expect(page.locator('mat-card').filter({ hasText: 'Password Set?' }).getByText('No')).toBeVisible();

    const resendStart = Date.now();
    await page.locator('mat-card').filter({ hasText: 'Password Set?' }).getByRole('button', { name: 'Resend' }).click();
    await expect(page.getByText('Setup Link Sent')).toBeVisible();
    await dismissSwal(page);

    const resetEmail = await getLatestEmail(targetEmail, { sinceMs: resendStart });
    const link = extractLink(resetEmail, 'forgot-password/reset');
    await page.goto(link);

    await expect(page.getByText('Create Your Password')).toBeVisible();
    await page.locator('input[formcontrolname="newPassword"]').fill(PASSWORD);
    await page.locator('input[formcontrolname="confirmPassword"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Password reset complete')).toBeVisible();

    // Still authenticated as admin throughout the reset (that page has no LoginGuard) -
    // /login does, so log out first or the guard bounces straight past it.
    await logout(page);
    await login(page, targetEmail, PASSWORD);
    await page.waitForURL('**/home');
  });
});
