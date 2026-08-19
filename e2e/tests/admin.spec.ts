import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login, loginAsAdmin } from '../helpers/auth';
import { openEditUserByEmail } from '../helpers/admin';
import { dismissSwal } from '../helpers/swal';

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
});
