import { FormControl, Validators } from '@angular/forms';

import { ProfileFieldValidators } from './profile-field-validators';
import { Constants } from '@core/constants';

describe('ProfileFieldValidators', () => {
  const originalConfig = { ...Constants.requiredProfileFields };

  afterEach(() => {
    Constants.requiredProfileFields = { ...originalConfig };
  });

  it('applies Validators.required when the field is configured as required', () => {
    Constants.requiredProfileFields = { ...originalConfig, firstName: true };

    const control = new FormControl('', ProfileFieldValidators.forField('firstName'));

    expect(control.valid).toBe(false);
    expect(control.hasError('required')).toBe(true);
  });

  it('applies no validators when the field is configured as not required', () => {
    Constants.requiredProfileFields = { ...originalConfig, firstName: false };

    const control = new FormControl('', ProfileFieldValidators.forField('firstName'));

    expect(control.valid).toBe(true);
  });

  it('appends extra validators regardless of the required config', () => {
    Constants.requiredProfileFields = { ...originalConfig, zipCode: false };
    const tooShort = Validators.minLength(5);

    const control = new FormControl('123', ProfileFieldValidators.forField('zipCode', [tooShort]));

    expect(control.valid).toBe(false);
    expect(control.hasError('minlength')).toBe(true);
  });
});
