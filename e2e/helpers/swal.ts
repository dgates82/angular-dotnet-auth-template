import { Page } from '@playwright/test';

/**
 * Dismisses a SweetAlert2 popup if one is currently visible. These render outside the
 * Angular app (appended to document.body) and block interaction with the underlying
 * page until dismissed - a no-op if nothing is showing.
 */
export async function dismissSwal(page: Page): Promise<void> {
  const confirmBtn = page.locator('.swal2-confirm');
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
  }
}
