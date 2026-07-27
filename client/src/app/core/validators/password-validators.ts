import { AbstractControl, ValidationErrors, Validators, ValidatorFn } from "@angular/forms";

import { LoggerService } from '@core/services/logger.service';

export class PasswordValidators {

  constructor(private readonly logger: LoggerService) { }

  static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = regex.test(control.value);

      return valid ? null : error;
    }
  }

  // The full set of validators used everywhere a user sets a new password
  // (register, password reset, change password), so the strength rules only
  // need to be defined in one place.
  static newPasswordValidators(): ValidatorFn[] {
    return [
      Validators.required,
      Validators.minLength(8),
      PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), {
        requiresDigit: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), {
        requiresUppercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), {
        requiresLowercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&_])"), {
        requiresSpecialChars: true
      }),
    ];
  }


  static matchValidator(c: AbstractControl): { mismatch: boolean } | null {
    if (c.value.confirmPassword.length === 0) {
      return null;
    }

    return c.value.newPassword === c.value.confirmPassword ? null : { mismatch: true };
  }

}
