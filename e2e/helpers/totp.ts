import { authenticator } from 'otplib';

const MIN_SAFE_SECONDS = 10;

/** Normalizes the shared key displayed by the app (spaced, lowercase) into a usable secret. */
export function normalizeSecret(displayedKey: string): string {
  return displayedKey.trim().replace(/\s+/g, '').toUpperCase();
}

/** Waits for a fresh TOTP window if the current one is about to expire, so the code doesn't go stale before the server verifies it. */
export async function generateCode(secret: string): Promise<string> {
  const remaining = authenticator.timeRemaining();
  if (remaining < MIN_SAFE_SECONDS) {
    await new Promise(resolve => setTimeout(resolve, (remaining + 1) * 1000));
  }
  return authenticator.generate(secret);
}
