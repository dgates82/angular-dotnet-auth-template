import { test, expect } from '@playwright/test';

import { uniqueEmail, registerAndConfirm, login } from '../helpers/auth';

const PASSWORD = 'Passw0rd!';

// is2FaRequired is baked into environment.ts at build time, so only the value the
// running app was actually built with can be exercised here - currently `false`.
// Covering the `true` case (forces a redirect to /enable2fa on login when 2FA isn't
// configured) would need a second build config in CI; deferred rather than adding
// that complexity to this batch. Confirmed manually multiple times this session by
// temporarily flipping the flag and rebuilding.
test.describe('is2FaRequired: false (current build)', () => {
  test('logging in without 2FA configured does not redirect to /enable2fa', async ({ page }) => {
    const email = uniqueEmail('2fa-not-required');
    await registerAndConfirm(page, email, PASSWORD);

    await login(page, email, PASSWORD);

    await page.waitForURL('**/home');
    expect(page.url()).not.toContain('/enable2fa');
  });
});

test.describe.skip('is2FaRequired: true - needs a second build config, not covered here', () => {
  test('logging in without 2FA configured forces a redirect to /enable2fa', async () => {
    // See file-level comment.
  });
});
