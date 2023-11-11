import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

import { LoggerService } from '@core/services/logger.service';

export class PasswordValidators {

  constructor(private readonly logger: LoggerService) { }

  static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }

      const valid = regex.test(control.value);

      return valid ? null : error;
    }
  }


  static matchValidator(c: AbstractControl): { mismatch: boolean } | null {
    if (c.value.confirmPassword.length === 0) {
      return null;
    }

    return c.value.newPassword === c.value.confirmPassword ? null : { mismatch: true };
  }

}
