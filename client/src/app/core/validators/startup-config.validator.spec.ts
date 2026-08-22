import { Constants } from '@core/constants';
import { validateTwoFaConfig } from './startup-config.validator';

describe('validateTwoFaConfig', () => {
  const originalIs2FaRequired = Constants.is2FaRequired;
  const originalTwoFaMethods = [...Constants.twoFaMethods];

  afterEach(() => {
    Constants.is2FaRequired = originalIs2FaRequired;
    Constants.twoFaMethods = [...originalTwoFaMethods];
  });

  it('throws when is2FaRequired is true and twoFaMethods is empty', () => {
    Constants.is2FaRequired = true;
    Constants.twoFaMethods = [];

    expect(() => validateTwoFaConfig()).toThrow(/is2FaRequired is true but twoFaMethods is empty/);
  });

  it('does not throw when is2FaRequired is true and twoFaMethods has at least one method', () => {
    Constants.is2FaRequired = true;
    Constants.twoFaMethods = ['Email'];

    expect(() => validateTwoFaConfig()).not.toThrow();
  });

  it('does not throw when is2FaRequired is false, regardless of twoFaMethods', () => {
    Constants.is2FaRequired = false;
    Constants.twoFaMethods = [];

    expect(() => validateTwoFaConfig()).not.toThrow();
  });
});
