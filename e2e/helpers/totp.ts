import { authenticator } from 'otplib';

/** Normalizes the shared key displayed by the app (spaced, lowercase) into a usable secret. */
export function normalizeSecret(displayedKey: string): string {
  return displayedKey.trim().replace(/\s+/g, '').toUpperCase();
}

export function generateCode(secret: string): string {
  return authenticator.generate(secret);
}
