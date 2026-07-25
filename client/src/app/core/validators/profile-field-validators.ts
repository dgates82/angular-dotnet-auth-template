import { ValidatorFn, Validators } from '@angular/forms';

import { Constants } from '@core/constants';

export type RequiredProfileField = keyof typeof Constants.requiredProfileFields;

// Applies Validators.required to a profile field only if it's turned on in
// Constants.requiredProfileFields (environment.ts/environment.prod.ts), so
// register-user/admin-personal-info/profile-personal-info don't each hardcode
// which fields are mandatory.
export class ProfileFieldValidators {
  static forField(field: RequiredProfileField, extra: ValidatorFn[] = []): ValidatorFn[] {
    return Constants.requiredProfileFields[field] ? [Validators.required, ...extra] : extra;
  }
}
