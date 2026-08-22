import { Constants } from '@core/constants';

// is2FaRequired: true with an empty twoFaMethods list locks every user out
// permanently - twoFaRequiredGuard forces everyone through 2FA setup with no way
// to skip it, and the setup screen itself has no method to show. That's a
// self-contradictory config, not a runtime edge case, so it fails loudly at
// startup instead of surfacing as a broken UI a developer has to debug from scratch.
export function validateTwoFaConfig(): void {
  if (Constants.is2FaRequired && Constants.twoFaMethods.length === 0) {
    throw new Error(
      'Invalid configuration: is2FaRequired is true but twoFaMethods is empty. ' +
      'At least one method must be configured in environment.ts when 2FA is required, ' +
      'or every user will be locked out with no way to complete setup.'
    );
  }
}
