import { Page, expect } from '@playwright/test';

/**
 * The users-list search box only filters on (keyup), which locator.fill() doesn't
 * dispatch - pressSequentially is required, or the list stays unfiltered and "first
 * row" silently means whatever happens to sort first (this hit the seeded admin
 * account itself once during manual testing). Verifies exactly one row matches
 * before clicking Edit, rather than trusting the filter blindly.
 */
export async function openEditUserByEmail(page: Page, email: string, options: { includeInactive?: boolean } = {}): Promise<void> {
  await page.goto('/admin/users');

  if (options.includeInactive) {
    await page.locator('mat-slide-toggle').filter({ hasText: 'Include Inactive Users' }).click();
  }

  const search = page.locator('input[placeholder="Search users"]');
  await search.click();
  await search.pressSequentially(email, { delay: 20 });

  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(email);

  await rows.first().locator('button').click();
  await page.waitForURL('**/admin/edit-user/**');
}
